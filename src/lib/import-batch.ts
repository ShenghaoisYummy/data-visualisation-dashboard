import { db } from "./database";
import { Decimal } from "@prisma/client/runtime/library";
import type {
  ProductCalculation,
  DatabaseDailyData,
} from "./inventory-calculator";
import type { ValidationResult } from "./data-validator";

export interface ImportBatchResult {
  success: boolean;
  batchId: string;
  summary: ImportSummary;
  errors?: ImportError[];
}

export interface ImportSummary {
  fileName: string;
  fileSize: number;
  totalRows: number;
  validRows: number;
  skippedRows: number;
  productsCreated: number;
  dailyDataCreated: number;
  processingTimeMs: number;
  duplicateProducts: string[];
}

export interface ImportError {
  type: "validation" | "database" | "processing";
  message: string;
  details?: any;
}

export interface ImportProgress {
  stage:
    | "parsing"
    | "validating"
    | "calculating"
    | "saving"
    | "completed"
    | "failed";
  message: string;
  progress: number; // 0-100
}

export class ImportBatchManager {
  /**
   * Process complete Excel import with transaction safety
   */
  static async processImport(
    userId: string,
    fileName: string,
    fileSize: number,
    calculations: ProductCalculation[],
    validationResult: ValidationResult,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<ImportBatchResult> {
    const startTime = Date.now();

    // Create import batch record
    const importBatch = await db.importBatch.create({
      data: {
        userId,
        fileName,
        fileSize: BigInt(fileSize),
        totalRows: validationResult.summary.totalRows,
        validRows: validationResult.summary.validRows,
        skippedRows: validationResult.summary.invalidRows,
        status: "PROCESSING",
        errorSummary:
          validationResult.errors.length > 0
            ? JSON.parse(
                JSON.stringify({
                  errors: validationResult.errors,
                  warnings: validationResult.warnings,
                })
              )
            : undefined,
      },
    });

    try {
      onProgress?.({
        stage: "saving",
        message: "Saving products and daily data to database",
        progress: 50,
      });

      // Process in smaller batches to avoid transaction timeouts
      const duplicateProducts: string[] = [];
      let productsCreated = 0;
      let dailyDataCreated = 0;

      const BATCH_SIZE = 20; // Process 20 products at a time for better transaction handling
      const batches = [];

      // Split calculations into batches
      for (let i = 0; i < calculations.length; i += BATCH_SIZE) {
        batches.push(calculations.slice(i, i + BATCH_SIZE));
      }

      // Process each batch in separate transactions with retry logic
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        let retryCount = 0;
        const MAX_RETRIES = 2;

        const processBatch = async (): Promise<{
          duplicates: string[];
          productsCreated: number;
          dailyDataCreated: number;
        }> => {
          return await db.$transaction(
            async (tx) => {
              const batchDuplicates: string[] = [];
              let batchProductsCreated = 0;
              let batchDailyDataCreated = 0;

              // Process each product calculation in this batch
              for (let index = 0; index < batch.length; index++) {
                const productCalc = batch[index];
                const overallIndex = batchIndex * BATCH_SIZE + index;
                const progress =
                  50 + Math.floor((overallIndex / calculations.length) * 40);
                onProgress?.({
                  stage: "saving",
                  message: `Processing product ${overallIndex + 1}/${
                    calculations.length
                  }`,
                  progress,
                });

                // Find or create product record (allow same products across different batches)
                let product = await tx.product.findFirst({
                  where: {
                    userId,
                    productId: productCalc.productId,
                  },
                });

                if (!product) {
                  // Create new product record
                  product = await tx.product.create({
                    data: {
                      productId: productCalc.productId,
                      productName: productCalc.productName,
                      openingInventory: productCalc.openingInventory,
                      userId,
                    },
                  });
                  batchProductsCreated++;
                } else {
                  // Check if this product already has data for this batch
                  const existingDailyData = await tx.dailyData.findFirst({
                    where: {
                      productId: product.id,
                      importBatchId: importBatch.id,
                    },
                  });

                  if (existingDailyData) {
                    batchDuplicates.push(productCalc.productId);
                    continue; // Skip if product already has data in this batch
                  }
                }

                // Prepare daily data for bulk insert
                const dailyDataToInsert = productCalc.dailyData.map(
                  (daily) => ({
                    productId: product.id,
                    daySequence: daily.day,
                    procurementQty: daily.procurementQty,
                    procurementPrice: daily.procurementPrice
                      ? new Decimal(daily.procurementPrice.toString())
                      : null,
                    procurementAmount: daily.procurementAmount
                      ? new Decimal(daily.procurementAmount.toString())
                      : null,
                    salesQty: daily.salesQty,
                    salesPrice: daily.salesPrice
                      ? new Decimal(daily.salesPrice.toString())
                      : null,
                    salesAmount: daily.salesAmount
                      ? new Decimal(daily.salesAmount.toString())
                      : null,
                    inventoryLevel: daily.inventoryLevel,
                    importBatchId: importBatch.id,
                    sourceRow: overallIndex + 2, // +2 for header and 1-based indexing
                  })
                );

                // Bulk insert daily data for this product
                await tx.dailyData.createMany({
                  data: dailyDataToInsert,
                });
                batchDailyDataCreated += dailyDataToInsert.length;
              }

              return {
                duplicates: batchDuplicates,
                productsCreated: batchProductsCreated,
                dailyDataCreated: batchDailyDataCreated,
              };
            },
            {
              maxWait: 15000, // Wait a maximum of 15 seconds to get a transaction from the pool
              timeout: 60000, // Allow transaction to run for up to 60 seconds
            }
          );
        };

        let batchResult;
        while (retryCount <= MAX_RETRIES) {
          try {
            batchResult = await processBatch();
            break; // Success, exit retry loop
          } catch (error) {
            retryCount++;
            if (retryCount > MAX_RETRIES) {
              throw error; // Re-throw after max retries
            }

            onProgress?.({
              stage: "saving",
              message: `Retrying batch ${batchIndex + 1}/${
                batches.length
              } (attempt ${retryCount + 1})`,
              progress: 50 + Math.floor((batchIndex / batches.length) * 40),
            });

            // Wait before retry (exponential backoff)
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * retryCount)
            );
          }
        }

        // Aggregate results
        duplicateProducts.push(...batchResult.duplicates);
        productsCreated += batchResult.productsCreated;
        dailyDataCreated += batchResult.dailyDataCreated;

        // Add a small delay between batches to reduce database load
        if (batchIndex < batches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms delay
        }
      }

      const result = { duplicateProducts, productsCreated, dailyDataCreated };

      const processingTimeMs = Date.now() - startTime;

      // Update import batch with completion status
      await db.importBatch.update({
        where: { id: importBatch.id },
        data: {
          status: "COMPLETED",
          processingTimeMs,
          completedAt: new Date(),
        },
      });

      onProgress?.({
        stage: "completed",
        message: "Import completed successfully",
        progress: 100,
      });

      return {
        success: true,
        batchId: importBatch.id,
        summary: {
          fileName,
          fileSize,
          totalRows: validationResult.summary.totalRows,
          validRows: validationResult.summary.validRows,
          skippedRows: validationResult.summary.invalidRows,
          productsCreated: result.productsCreated,
          dailyDataCreated: result.dailyDataCreated,
          processingTimeMs,
          duplicateProducts: result.duplicateProducts,
        },
      };
    } catch (error) {
      // Mark import as failed
      await db.importBatch.update({
        where: { id: importBatch.id },
        data: {
          status: "FAILED",
          errorSummary: {
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
          },
          processingTimeMs: Date.now() - startTime,
          completedAt: new Date(),
        },
      });

      onProgress?.({
        stage: "failed",
        message: `Import failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        progress: 0,
      });

      return {
        success: false,
        batchId: importBatch.id,
        summary: {
          fileName,
          fileSize,
          totalRows: 0,
          validRows: 0,
          skippedRows: 0,
          productsCreated: 0,
          dailyDataCreated: 0,
          processingTimeMs: Date.now() - startTime,
          duplicateProducts: [],
        },
        errors: [
          {
            type: "database",
            message: error instanceof Error ? error.message : "Unknown error",
            details: error,
          },
        ],
      };
    }
  }

  /**
   * Get import batch history for a user
   */
  static async getImportHistory(
    userId: string,
    limit: number = 10
  ): Promise<ImportBatchHistory[]> {
    const batches = await db.importBatch.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        totalRows: true,
        validRows: true,
        skippedRows: true,
        status: true,
        processingTimeMs: true,
        createdAt: true,
        completedAt: true,
        errorSummary: true,
      },
    });

    return batches.map((batch) => ({
      id: batch.id,
      fileName: batch.fileName,
      fileSize: Number(batch.fileSize),
      totalRows: batch.totalRows,
      validRows: batch.validRows,
      skippedRows: batch.skippedRows,
      status: batch.status,
      processingTimeMs: batch.processingTimeMs,
      createdAt: batch.createdAt,
      completedAt: batch.completedAt,
      hasErrors: batch.errorSummary !== null,
    }));
  }

  /**
   * Get detailed import batch information
   */
  static async getImportBatchDetails(
    batchId: string,
    userId: string
  ): Promise<ImportBatchDetails | null> {
    const batch = await db.importBatch.findFirst({
      where: {
        id: batchId,
        userId,
      },
      include: {
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });

    if (!batch) return null;

    // Get products created in this batch
    const productsCreated = await db.product.count({
      where: {
        userId,
        dailyData: {
          some: {
            importBatchId: batchId,
          },
        },
      },
    });

    return {
      id: batch.id,
      fileName: batch.fileName,
      fileSize: Number(batch.fileSize),
      totalRows: batch.totalRows,
      validRows: batch.validRows,
      skippedRows: batch.skippedRows,
      status: batch.status,
      processingTimeMs: batch.processingTimeMs,
      createdAt: batch.createdAt,
      completedAt: batch.completedAt,
      hasErrors:
        batch.errorSummary !== null && batch.errorSummary !== undefined,
      errorSummary: batch.errorSummary as any,
      productsCreated,
      user: batch.user,
    };
  }

  /**
   * Delete import batch and associated data (admin function)
   */
  static async deleteImportBatch(
    batchId: string,
    userId: string
  ): Promise<boolean> {
    try {
      await db.$transaction(async (tx) => {
        // First, delete all daily data associated with this batch
        await tx.dailyData.deleteMany({
          where: {
            importBatchId: batchId,
            product: {
              userId,
            },
          },
        });

        // Find products that have no daily data left and delete them
        const productsToDelete = await tx.product.findMany({
          where: {
            userId,
            dailyData: {
              none: {},
            },
          },
          select: { id: true },
        });

        if (productsToDelete.length > 0) {
          await tx.product.deleteMany({
            where: {
              id: {
                in: productsToDelete.map((p) => p.id),
              },
            },
          });
        }

        // Finally, delete the import batch
        await tx.importBatch.delete({
          where: {
            id: batchId,
            userId,
          },
        });
      });

      return true;
    } catch (error) {
      console.error("Failed to delete import batch:", error);
      return false;
    }
  }

  /**
   * Get import statistics for a user
   */
  static async getImportStatistics(userId: string): Promise<ImportStatistics> {
    const stats = await db.importBatch.aggregate({
      where: { userId },
      _count: {
        id: true,
      },
      _sum: {
        totalRows: true,
        validRows: true,
        skippedRows: true,
      },
      _avg: {
        processingTimeMs: true,
      },
    });

    const statusCounts = await db.importBatch.groupBy({
      by: ["status"],
      where: { userId },
      _count: {
        status: true,
      },
    });

    const recentBatches = await db.importBatch.count({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    return {
      totalImports: stats._count.id || 0,
      totalRowsProcessed: stats._sum.totalRows || 0,
      totalValidRows: stats._sum.validRows || 0,
      totalSkippedRows: stats._sum.skippedRows || 0,
      averageProcessingTime: Math.round(stats._avg.processingTimeMs || 0),
      successfulImports:
        statusCounts.find((s) => s.status === "COMPLETED")?._count.status || 0,
      failedImports:
        statusCounts.find((s) => s.status === "FAILED")?._count.status || 0,
      recentImports: recentBatches,
    };
  }
}

// Supporting interfaces
export interface ImportBatchHistory {
  id: string;
  fileName: string;
  fileSize: number;
  totalRows: number;
  validRows: number;
  skippedRows: number;
  status: string;
  processingTimeMs: number | null;
  createdAt: Date;
  completedAt: Date | null;
  hasErrors: boolean;
}

export interface ImportBatchDetails extends ImportBatchHistory {
  errorSummary: any;
  productsCreated: number;
  user: {
    username: string;
    email: string;
  };
}

export interface ImportStatistics {
  totalImports: number;
  totalRowsProcessed: number;
  totalValidRows: number;
  totalSkippedRows: number;
  averageProcessingTime: number; // milliseconds
  successfulImports: number;
  failedImports: number;
  recentImports: number; // last 30 days
}
