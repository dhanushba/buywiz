"use server"

import { revalidatePath } from "next/cache";
import Product from "../models/product.model";
import { connectToDB } from "../mongoose";
import { scrapeProduct } from "../scraper";
import { getAveragePrice, getHighestPrice, getLowestPrice } from "../utils";
import { generateEmailBody, sendEmail } from "../nodemailer";
import Users from "../models/users.model";

export async function scrapeAndStoreProduct(productUrl: string|undefined, email: string) {
  if (!productUrl) {
    console.error("No product URL provided");
    return null;
  }

  try {
    connectToDB();
    console.log("Scraping product from:", productUrl);

    const scrapedProduct = await scrapeProduct(productUrl);

    if (!scrapedProduct) {
      console.error("Scraper returned null for:", productUrl);
      return null;
    }

    console.log("✅ Product scraped successfully:", scrapedProduct.title);

    let product = scrapedProduct;

    const existingProduct = await Product.findOne({ url: scrapedProduct.url });

    if (existingProduct) {
      const updatedPriceHistory: any = [
        ...existingProduct.priceHistory,
        { price: scrapedProduct.currentPrice }
      ]

      product = {
        ...scrapedProduct,
        priceHistory: updatedPriceHistory,
        lowestPrice: getLowestPrice(updatedPriceHistory),
        highestPrice: getHighestPrice(updatedPriceHistory),
        averagePrice: getAveragePrice(updatedPriceHistory),
      }
    }

    const newProduct = await Product.findOneAndUpdate(
      { url: scrapedProduct.url },
      {
        user_email: email,
        ...product
      },
      { upsert: true, new: true }
    );

    if (newProduct) {
      const store_id = await Users.findOneAndUpdate(
        { email },
        { $addToSet: { product_id: newProduct._id.toString() } },
        { new: true, upsert: true }
      );
      console.log(`Scraped product: ${newProduct._id}`);
    }

    revalidatePath(`/products/${newProduct._id}`);
    //revalidatePath(`/products/${newProduct._id}?email=${email}`);

    const result = JSON.parse(JSON.stringify({ "id": newProduct._id }));
    console.log("🎉 Product stored successfully with ID:", result.id);
    return result; // Return product id
  } catch (error: any) {
    console.error("❌ Failed to create/update product:", error.message);
    throw new Error(`Failed to create/update product: ${error.message}`);
  }
}

export async function getProductById(productId: string) {
  try {
    connectToDB();

    const product = await Product.findOne({ _id: productId });

    if (!product) return null;

    return product;
  } catch (error) {
    console.log(error);
  }
}


// export async function getAllProducts() {
//   try {
//     connectToDB();

//     const products = await Product.find();

//     return products;
//   } catch (error) {
//     console.log(error);
//   }
// }

export async function getAllProducts(user_email: string) {
  try {
    connectToDB();

    const user_products = await Users.findOne({ email: user_email });
    // const products=user_products.product_id;
    console.log(user_products.product_id);
    if (user_products)
      return user_products.product_id;
    else
      return null;
  } catch (error) {
    console.log(error);
  }
}

export async function getSimilarProducts(productId: string) {
  try {
    connectToDB();

    const currentProduct = await Product.findById(productId);

    if (!currentProduct) return null;

    const similarProducts = await Product.find({
      _id: { $ne: productId },
    }).limit(3);

    return similarProducts;
  } catch (error) {
    console.log(error);
  }
}

export async function addUserEmailToProduct(productId: string, userEmail: string) {
  try {
    const product = await Product.findById(productId);
    if (!product) return;

    // Optionally update users list only if email is new
    const userExists = product.users.some((user: { email: string }) => user.email === userEmail);
    if (!userExists) {
      product.users.push({ email: userEmail });
      await product.save();
    }

    // Always send the email
    const emailContent = await generateEmailBody(product, "WELCOME");
    await sendEmail(emailContent, [userEmail]);
  } catch (error) {
    console.log(error);
  }
}
