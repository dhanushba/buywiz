import { NextResponse } from "next/server";
import { getLowestPrice, getHighestPrice, getAveragePrice, getEmailNotifType } from "@/lib/utils";
import { connectToDB } from "@/lib/mongoose";
import Product from "@/lib/models/product.model";
import { scrapeProduct } from "@/lib/scraper";
import { generateEmailBody, sendEmail } from "@/lib/nodemailer";

export const maxDuration = 60; // This function can run for a maximum of 300 seconds
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    await connectToDB(); // Make sure to await DB connection

    const products = await Product.find({});

    if (!products) throw new Error("No product fetched");

    // 1 SCRAPE LATEST PRODUCT DETAILS & UPDATE DB
    const updatedProducts = await Promise.all(
      products.map(async (currentProduct) => {
        // Scrape product
        const scrapedProduct = await scrapeProduct(currentProduct.url);

        if (!scrapedProduct) return;

        // Check if any details have changed
        const updatedPriceHistory = [
          ...currentProduct.priceHistory,
          {
            price: scrapedProduct.currentPrice,
          },
        ];

        const lowestPrice = getLowestPrice(updatedPriceHistory);
        const highestPrice = getHighestPrice(updatedPriceHistory);
        const averagePrice = getAveragePrice(updatedPriceHistory);

        const isUpdated =
          scrapedProduct.currentPrice !== currentProduct.currentPrice ||
          lowestPrice !== currentProduct.lowestPrice ||
          highestPrice !== currentProduct.highestPrice ||
          averagePrice !== currentProduct.averagePrice;

        if (isUpdated) {
          // If any of the product details have changed, update the product
          const updatedProduct = {
            ...scrapedProduct,
            priceHistory: updatedPriceHistory,
            lowestPrice,
            highestPrice,
            averagePrice,
          };

          // Update the product in the database
          await Product.findOneAndUpdate(
            { url: currentProduct.url },
            updatedProduct,
            { new: true } // Returns the updated document
          );

          // ======================== 2 CHECK EACH PRODUCT'S STATUS & SEND EMAIL ACCORDINGLY
          // Ensure scrapedProduct has valid image and discountRate (use fallbacks)
          const scrapedProductWithFallback = {
            ...scrapedProduct,
            image: scrapedProduct.image || currentProduct.image || '',
            discountRate: Number(scrapedProduct.discountRate) || 0,
          };
          
          const emailNotifType = getEmailNotifType(scrapedProductWithFallback, currentProduct);

          if (emailNotifType && currentProduct.users.length > 0) {
            // Updated productInfo with more details
            const productInfo = {
              title: currentProduct.title,
              url: currentProduct.url,
              currentPrice: scrapedProduct.currentPrice,
              lowestPrice: lowestPrice,
              highestPrice: highestPrice,
              averagePrice: averagePrice,
              image: updatedProduct.image || currentProduct.image || '',

            };

            // Construct emailContent
            const emailContent = await generateEmailBody(productInfo, emailNotifType);

            // Get array of user emails
            const userEmails = currentProduct.users.map((user: any) => user.email);

            // Send email notification
            await sendEmail(emailContent, userEmails);
          }

          return updatedProduct;
        }

        // If no changes, just return the current product
        return currentProduct;
      })
    );

    return NextResponse.json({
      message: "Ok",
      data: updatedProducts,
    });
  } catch (error: any) {
    throw new Error(`Failed to get all products: ${error.message}`);
  }
}
