"use server";

import axios from "axios";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";
import { extractCurrency, extractPrice } from "../utils";
import { ProductDescription } from "@/types";

// BrightData proxy configuration
const username = String(process.env.BRIGHT_DATA_USERNAME || '');
const password = String(process.env.BRIGHT_DATA_PASSWORD || '');
const port = 22225;
const session_id = (1000000 * Math.random()) | 0;

const puppeteer_config = {
  headless: true,
  slowMo: 50,
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
};

const options = username && password ? {
  auth: {
    username: `${username}-session-${session_id}`,
    password,
  },
  host: "brd.superproxy.io",
  port,
  rejectUnauthorized: false,
} : {}; // Use direct connection if proxy credentials not provided

/**
 * Generic scrape method for scraping product details from the given url
 */
export async function scrapeProduct(url: string) {
  if (!url) return null;

  try {
    const hostname = new URL(url).hostname;

    if (hostname.includes("amazon."))
      // if url matches amazon domain
      return getAmazonData(url);
    if (hostname.includes("flipkart."))
      // if url matches flipkart domain
      return getFlipkartData(url);
    if (hostname.includes("croma."))
      // if url matches croma domain
      return getCromaData(url);
    if (hostname.includes("reliancedigital.in"))
      // if url matches reliance-digital domain
      return getRelianceDigitalData(url);
  } catch (error: any) {
    console.log(error);
  }
}

/**
 * Scrape product data from Amazon
 */
async function getAmazonData(url: string) {
  if (!url) return null;

  try {
    // Fetch the product page
    const response = await axios.get(url, options);
    const $ = cheerio.load(response.data);

    // Extract the product title
    const title = $("#productTitle").text().trim();
    const currentPrice = extractPrice(
      $(".priceToPay span.a-price-whole"),
      $(".a.size.base.a-color-price"),
      $(".a-button-selected .a-color-base")
    );

    const originalPrice = extractPrice(
      $("#priceblock_ourprice"),
      $(".a-price.a-text-price span.a-offscreen"),
      $("#listPrice"),
      $("#priceblock_dealprice"),
      $(".a-size-base.a-color-price")
    );

    const outOfStock = $("#availability_feature_div")
      .text()
      .trim()
      .toLowerCase()
      .includes("unavailable");

    const images =
      $("#imgBlkFront").attr("data-a-dynamic-image") ||
      $("#landingImage").attr("data-a-dynamic-image") ||
      "{}";

    const imageUrls = Object.keys(JSON.parse(images));

    const currency = extractCurrency($(".a-price-symbol"));
    const discountRate = $(".savingsPercentage").text().replace(/[-%]/g, "");

    const keyFeatures = "div#feature-bullets ul.a-unordered-list li span";
    const table =
      "div#prodDetails table#productDetails_techSpec_section_1:nth-child(1)";
    const obj = {
      keys: $(`${table} th`)
        .map((_, e) => $(e).text().trim())
        .get(),
      values: $(`${table} td`)
        .map((_, e) => $(e).text().trim())
        .get(),
    };
    const description: ProductDescription = {
      features: [],
      specifications: {},
    };
    for (let i = 0; i < obj.keys.length; i++)
      description.specifications[obj.keys[i]] = obj.values[i];
    description.features = $(`${keyFeatures}`)
      .map((_, e) => $(e).text().trim())
      .get();

    // Construct data object with scraped information
    const data = {
      url,
      currency: currency || "₹",
      image: imageUrls[0],
      title,
      currentPrice: Number(currentPrice) || Number(originalPrice),
      originalPrice: Number(originalPrice) || Number(currentPrice),
      priceHistory: [],
      discountRate: Number(discountRate),
      category: "category",
      reviewsCount: 100,
      stars: 4.5,
      isOutOfStock: outOfStock,
      description: JSON.stringify(description),
      lowestPrice: Number(currentPrice) || Number(originalPrice),
      highestPrice: Number(originalPrice) || Number(currentPrice),
      averagePrice: Number(currentPrice) || Number(originalPrice),
    };

    if (data.currency.toUpperCase() == "INR") data.currency = "₹";

    return data;
  } catch (error: any) {
    console.log(error);
  }
  return null;
}

/**
 * Scrape product data from Flipkart
 */
async function getFlipkartData(url: string) {
  if (!url) return null;

  const imgResolution = "image/512/512",
    imgRE = /image\/\d+\/\d+/;
  const browser = await puppeteer.launch(puppeteer_config);
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Extract JSON-LD data
    const jsonLD = await page.$$eval(
      "script#jsonLD",
      (scripts) =>
        scripts
          .map((script) => {
            try {
              return JSON.parse(script.textContent || "");
            } catch {
              return null;
            }
          })
          .filter(Boolean)[0]
    );

    // Wait for page content for scraping
    const content = await page.content();
    const $ = cheerio.load(content);

    const productData = jsonLD.find((d: any) => d["@type"] == "Product");

    if (!productData)
      console.log("Product data not found! Scraping from page content...");

    const title: string = productData?.name || (await page.title());
    const image: string =
      productData?.image?.replace(imgRE, imgResolution) ||
      $('img[fetchpriority="high"]').attr("src") ||
      $('img[loading="eager"]').attr("src") ||
      "";
    const reviewsCount: number =
      productData?.aggregateRating?.reviewCount || 100;
    const stars: number = productData?.aggregateRating?.ratingValue || 4.5;
    const outOfStock: boolean =
      productData == null || productData == undefined || false;
    const offer = productData?.offers || {};
    const currency: string = offer?.priceCurrency || "INR";
    var currentPrice: string = offer?.price || "0";

    const list = jsonLD.find(
      (d: any) => d["@type"] == "BreadcrumbList"
    )?.itemListElement;

    if (!list) throw new Error("No category list found for product");

    var category: string = list[1]?.item?.name || "category";
    url = list[list.length - 1]?.item["@id"] || url;

    const dPrice_orgPriceRE = /^\s*₹[\d,]+\s*₹[\d,]+\s*$/;
    const priceRE = /₹[\d,]+/g,
      dPrice_orgPrice_DiscountRE = /^\s*₹[\d,]+\s*₹[\d,]+\s*\d+% off\s*$/;

    let texts = $("div")
      .map((_, ele) => {
        if ($(ele).text().match(dPrice_orgPrice_DiscountRE)) return $(ele);
        if ($(ele).text().match(dPrice_orgPriceRE)) return $(ele);
        if (currentPrice !== "0")
          if ($(ele).text().match(`/^\s+₹\s*${currentPrice}\s*₹[\d,]+\s*$/`))
            return $(ele);
      })
      .toArray();

    const extractData = texts[0],
      s = extractData.html()?.replaceAll(/<!--(.*?)-->/g, "") || "";

    var matches;
    const prices = [];
    do {
      matches = priceRE.exec(s);
      if (matches) {
        prices.push(matches[0]);
      }
    } while (matches);

    if (currentPrice === "0")
      currentPrice = prices[0].replace(/[^\d]/g, "").replace(/,/, "");
    const originalPrice = prices[1]?.replace(/[^\d]/g, "").replace(/,/, "");

    const discountRate = $('span:contains("% off")')
      .text()
      .replace(/% off.*/, "");

    const description: ProductDescription = {
      features: [],
      specifications: {},
    };
    description.features = $('div:contains("Description") + div')
      .html()
      ?.trim()
      .replaceAll(/<(.*?)>/g, "")
      .split("\n")
      .filter(Boolean) as any[];

    // const specs = {};
    $("table").each((_, table) => {
      const category = $(table).prev().text().trim(); // Extract category name
      if (!category) return;
      // specs[category] = {};
      $(table)
        .find("tr")
        .each((_, row) => {
          const key = $(row).find("td").first().text().trim();
          const value = $(row).find("td").last().text().trim();
          if (key && value) description.specifications[key] = value;
        });
    });

    // Construct data object with scraped information
    const data = {
      url,
      currency: currency || "₹",
      image,
      title,
      currentPrice: Number(currentPrice) || Number(originalPrice),
      originalPrice: Number(originalPrice) || Number(currentPrice),
      priceHistory: [],
      discountRate: Number(discountRate),
      category,
      reviewsCount,
      stars,
      isOutOfStock: outOfStock,
      description: JSON.stringify(description),
      lowestPrice: Number(currentPrice) || Number(originalPrice),
      highestPrice: Number(originalPrice) || Number(currentPrice),
      averagePrice: Number(currentPrice) || Number(originalPrice),
    };

    if (data.currency.toUpperCase() == "INR") data.currency = "₹";

    // console.log(data);

    await browser.close();

    return data;
  } catch (error) {
    console.error(`Error while scraping flipkart data: ${error}`);
    console.error(error);
  }
  await browser.close();
  return null;
}

/**
 * Scrape product data from RelianceDigital
 */
async function getRelianceDigitalData(url: string) {
  if (!url) return null;

  const browser = await puppeteer.launch(puppeteer_config);

  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Extract JSON-LD data
    const jsonLdArray = await page.$$eval(
      'script[type="application/ld+json"]',
      (scripts) =>
        scripts
          .map((script) => {
            try {
              return JSON.parse(script.textContent || "");
            } catch {
              return null;
            }
          })
          .filter(Boolean)
    );

    const productData = jsonLdArray.find((d: any) => d["@type"] === "Product");

    if (!productData) throw new Error("No Product JSON-LD found");

    const title: string = productData.name || "Title not available";
    const image: string = productData.image || "";
    const offer = productData.offers || {};
    const price: string = offer.price || "0";
    const currency: string = offer.priceCurrency || "INR";
    const availability: string = offer.availability || "InStock";

    // Get full HTML for cheerio
    const html = await page.content();
    const $ = cheerio.load(html);

    // let description = $('.product-description-container').text().trim() || 'Description not available';
    const description: ProductDescription = {
      features: [],
      specifications: {},
    };

    // const specificationsObj: Specifications = {};
    $("#specification .lb_item-copy-ct > div").each((_, section) => {
      const category = $(section).find(".specifications-header").text().trim();
      if (!category) return;

      // const specs: { [key: string]: string } = {};
      $(section)
        .find("li.specifications-list")
        .each((_, item) => {
          const key = $(item).find("span").first().text().trim();
          const value = $(item)
            .find(".specifications-list--right")
            .text()
            .trim();
          if (key && value) {
            // specs[key] = value;
            description.specifications[key] = value;
          }
        });
      // specificationsObj[category] = specs;
    });

    // const keyFeatures: string[] = [];
    // $('#key_features ul.features li').each((_, li) => {
    //   const feature = $(li).text().trim();
    //   if (feature) keyFeatures.push(feature);
    // });
    description.features = $("#key_features ul.features li")
      .map((_, li) => $(li).text().trim())
      .get();

    const reviewsCount =
      parseInt($(".review-count-text").text().replace(/\D/g, "")) || 0;
    const stars =
      parseFloat($(".averageStarRatingNumerical").text().trim()) || 0;

    const discountRateText =
      $(".discount-tag").text().replace(/[-%]/g, "").trim() || "0";
    const discountRate = parseFloat(discountRateText) || 0;

    const currentPrice = parseFloat(price.replace(/[^0-9.-]+/g, "")) || 0;
    const originalPrice = currentPrice;
    // const priceAfterDiscount = originalPrice - (originalPrice * discountRate / 100);

    const data = {
      url,
      currency,
      image,
      title,
      currentPrice,
      originalPrice,
      priceHistory: [],
      discountRate,
      category: "category",
      reviewsCount,
      stars,
      isOutOfStock: !availability.includes("InStock"),
      description: JSON.stringify(description),
      lowestPrice: currentPrice,
      highestPrice: originalPrice,
      averagePrice: currentPrice,
    };

    if (data.currency.toUpperCase() == "INR") data.currency = "₹";

    // console.log(data);

    return data;
  } catch (err: any) {
    console.error("Scraping error:", err);
    // return { error: err.message };
  } finally {
    await browser.close();
  }
  return null;
}

/**
 * Scrape product data from Croma
 */
async function getCromaData(url: string) {
  if (!url) return null;

  const browser = await puppeteer.launch(puppeteer_config);

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
  );

  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (["image", "stylesheet", "font"].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  try {
    // await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    // Wait for the title element to appear
    await Promise.all([
      page.waitForSelector(".pd-title", { timeout: 60000 }),
      // page.waitForSelector('#pdp-product-price'),
      // page.waitForSelector('#old-price'),
    ]);

    // Extract the title text
    const title = await page.$eval(".pd-title.pd-title-normal", (el) =>
      (el.textContent ?? "").trim()
    );
    // console.log('Product Title:', title);

    const currentPrice = await page.$eval("#pdp-product-price", (el) =>
      (el.textContent ?? "").trim()
    );
    const cp = currentPrice.replace(/[^\d.]/g, "").split(".")[0];
    // console.log(cp)

    const oldPriceElement = await page.$("#old-price");
    let op = null;
    if (oldPriceElement) {
      const originalPrice = await page.$eval("#old-price", (el) =>
        (el.textContent ?? "").trim()
      );
      op = originalPrice.replace(/[^\d.]/g, "").split(".")[0];
    }

    // const features= await page.$eval('.cp-keyfeature.pd-eligibility-wrap', el => (el.textContent ?? '').trim());

    const features = await page.$$eval(
      ".cp-keyfeature.pd-eligibility-wrap li",
      (elements) => elements.map((el) => (el.textContent ?? "").trim())
    );

    const specifications = await page.$$eval(
      ".cp-specification-info",
      (uls) => {
        const specs: { [key: string]: string } = {};
        uls.forEach((ul) => {
          const keyEl = ul.querySelector(
            ".cp-specification-spec-info:nth-child(1)"
          );
          const valueEl = ul.querySelector(
            ".cp-specification-spec-info:nth-child(2)"
          );
          if (keyEl && valueEl) {
            const key = (keyEl.textContent ?? "").trim();
            const value = (valueEl.textContent ?? "").trim();
            specs[key] = value;
          }
        });
        return specs;
      }
    );

    const description: ProductDescription = {
      features,
      specifications,
    };

    const discountElement = await page.$(".dicount-value");
    let discount = null;
    if (discountElement) {
      const discountRate = await page.$eval(".dicount-value", (el) =>
        (el.textContent ?? "").trim()
      );
      const match = discountRate.match(/(\d+(\.\d+)?)/);
      discount = match ? match[1] : null;
    }

    const imageUrl = await page.$eval('[id="0prod_img"]', (el) =>
      el.getAttribute("data-src")
    );

    console.log(imageUrl);

    await browser.close();

    const data = {
      url,
      currency: "₹",
      image: imageUrl,
      title,
      currentPrice: Number(cp) || Number(op),
      originalPrice: Number(op) || Number(cp),
      priceHistory: [],
      discountRate: discount,
      category: "category",
      reviewsCount: 100,
      stars: 4.5,
      isOutOfStock: false,
      description: JSON.stringify(description),
      lowestPrice: Number(cp) || Number(op),
      highestPrice: Number(op) || Number(cp),
      averagePrice: Number(cp) || Number(op),
    };

    return data;
  } catch (error) {
    console.error("Error scraping:", error);
    await browser.close();
  }
  // try {
  //   await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  //   const html = await page.content();
  //   const $ = cheerio.load(html);

  //   const title = $('.pd-title.pd-title-normal').text().trim();
  //   const currentPrice = $('#pdp-product-price').text().trim();
  //   const cp = currentPrice.replace(/[^\d.]/g, '').split('.')[0];

  //   const opEl = $('#old-price').text().trim();
  //   const op = opEl ? opEl.replace(/[^\d.]/g, '').split('.')[0] : null;

  //   const features: string[] = [];
  //   $('.cp-keyfeature.pd-eligibility-wrap li').each((_, el) => {
  //     features.push($(el).text().trim());
  //   });

  //   const specifications: { [key: string]: string } = {};
  //   $('.cp-specification-info').each((_, el) => {
  //     const key = $(el).find('.cp-specification-spec-info').eq(0).text().trim();
  //     const value = $(el).find('.cp-specification-spec-info').eq(1).text().trim();
  //     if (key) specifications[key] = value;
  //   });

  //   const description: ProductDescription = {
  //     features,
  //     specifications
  //   };

  //   const discountRate = $('.dicount-value').text().replace(/[-%]/g, "").trim() || '0';
  //   const discount = parseFloat(discountRate) || 0;

  //   const imageUrl = $('[id="0prod_img"]').attr('data-src') || '';

  //   const data = {
  //     url,
  //     currency: '₹',
  //     image: imageUrl,
  //     title,
  //     currentPrice: Number(cp) || Number(op),
  //     originalPrice: Number(op) || Number(cp),
  //     priceHistory: [],
  //     discountRate: discount,
  //     category: 'category',
  //     reviewsCount: 100,
  //     stars: 4.5,
  //     isOutOfStock: false,
  //     description: JSON.stringify(description),
  //     lowestPrice: Number(cp) || Number(op),
  //     highestPrice: Number(op) || Number(cp),
  //     averagePrice: Number(cp) || Number(op),
  //   }
  //   return data;
  // } catch (error) {
  //   console.error('Error scraping:', error);
  //   await browser.close();
  // }
  return null;
}
