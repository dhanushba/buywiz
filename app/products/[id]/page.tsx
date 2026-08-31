import Modal from "@/components/Modal";
import PriceInfoCard from "@/components/PriceInfoCard";
import ProductCard from "@/components/ProductCard";
import { getAllProducts, getProductById, getSimilarProducts } from "@/lib/actions";
import { connectToDB } from "@/lib/mongoose";
import { formatNumber } from "@/lib/utils";
import { ProductDescription, Products } from "@/types";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import Product from "@/lib/models/product.model"
import ProductDescriptionComponent from "@/components/ProductDescription";

type Props = {
  params: Promise<{ id: string }>;
};

function buildDescription(str: string) {
  try {
    const description = JSON.parse(str) as ProductDescription
    return (
      <>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h4 className="text-xl text-secondary font-semibold mb-4">Key features of the product</h4>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            {description?.features?.map((feature, index) => (
              <li key={index} className="text-lg">{feature}</li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-6 mt-6 rounded-lg shadow-lg">
          <h4 className="text-xl text-secondary font-semibold mb-4">Product specifications</h4>
          <table className="min-w-full table-auto border-collapse text-left">
            <tbody className="text-gray-700">
              {Object.keys(description.specifications).map((key, index) => (
                <tr key={index} className="border-b">
                  <td className="px-4 py-2 font-semibold">{key}</td>
                  <td className="px-4 py-2">{description.specifications[key]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  } catch (error) {
    console.error(`Error while parsing product description ${error}`);
    return <>{str}</>
  }
}

const ProductDetails = async ({ params }: Props) => {
  // Wait for params to be resolved
  const { id } = await params;

  // Fetch product by id
  const product: Products = await getProductById(id);

  if (!product) redirect('/'); // Redirect if product is not found

  // Fetch similar products
  // const similarProducts = await getSimilarProducts(id);
  const cookieStore = await cookies();
  const userEmail = cookieStore.get("user_email")?.value;
  console.log(userEmail);
  let similarProducts = [];
  if (userEmail) {
    const ProductIds = await getAllProducts(userEmail);
    // console.log(ProductIds);
    if (ProductIds.length > 0) {
      connectToDB();
      similarProducts = await Product.find({ _id: { $in: ProductIds } });
      // console.log("Fetched Products:", allProducts);
    }
  }

  return (
    <div className="product-container">
      <div className="flex gap-28 xl:flex-row flex-col">
        <div className="product-image">
          <Image
            src={product.image}
            alt={product.title}
            width={580}
            height={400}
            className="mx-auto"
          />
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-start gap-5 flex-wrap pb-6">
            <div className="flex flex-col gap-3">
              <p className="text-[28px] text-secondary font-semibold">
                {product.title}
              </p>

              <Link
                href={product.url}
                target="_blank"
                className="text-base text-black opacity-50"
              >
                Visit Product
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <div className="product-hearts">
                <Image
                  src="/assets/icons/red-heart.svg"
                  alt="heart"
                  width={20}
                  height={20}
                />

                <p className="text-base font-semibold text-[#D46F77]">
                  {product.reviewsCount}
                </p>
              </div>

              <div className="p-2 bg-white-200 rounded-10">
                <Image
                  src="/assets/icons/bookmark.svg"
                  alt="bookmark"
                  width={20}
                  height={20}
                />
              </div>

              <div className="p-2 bg-white-200 rounded-10">
                <Image
                  src="/assets/icons/share.svg"
                  alt="share"
                  width={20}
                  height={20}
                />
              </div>
            </div>
          </div>

          <div className="product-info">
            <div className="flex flex-col gap-2">
              {
                product.isOutOfStock ?
                  <p className="text-[28px] text-secondary font-bold"> Currently Unavailable </p>
                  :
                  <>
                    <p className="text-[34px] text-secondary font-bold">
                      {product.currency} {formatNumber(product.currentPrice)}
                    </p>
                    <p className="text-[21px] text-black opacity-50 line-through">
                      {product.currency} {formatNumber(product.originalPrice)}
                    </p>
                  </>
              }
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex gap-3">
                <div className="product-stars">
                  <Image
                    src="/assets/icons/star.svg"
                    alt="star"
                    width={16}
                    height={16}
                  />
                  <p className="text-sm text-primary-orange font-semibold">
                    {product.stars || '25'}
                  </p>
                </div>

                <div className="product-reviews">
                  <Image
                    src="/assets/icons/comment.svg"
                    alt="comment"
                    width={16}
                    height={16}
                  />
                  <p className="text-sm text-secondary font-semibold">
                    {product.reviewsCount} Reviews
                  </p>
                </div>
              </div>

              <p className="text-sm text-black opacity-50">
                <span className="text-primary-green font-semibold">93% </span> of
                buyers have recommended this.
              </p>
            </div>
          </div>

          <div className="my-7 flex flex-col gap-5">
            <div className="flex gap-5 flex-wrap">
              <PriceInfoCard
                title="Current Price"
                iconSrc="/assets/icons/price-tag.svg"
                value={`${product.currency} ${formatNumber(product.currentPrice)}`}
              />
              <PriceInfoCard
                title="Average Price"
                iconSrc="/assets/icons/chart.svg"
                value={`${product.currency} ${formatNumber(product.averagePrice)}`}
              />
              <PriceInfoCard
                title="Highest Price"
                iconSrc="/assets/icons/arrow-up.svg"
                value={`${product.currency} ${formatNumber(product.highestPrice)}`}
              />
              <PriceInfoCard
                title="Lowest Price"
                iconSrc="/assets/icons/arrow-down.svg"
                value={`${product.currency} ${formatNumber(product.lowestPrice)}`}
              />
            </div>
          </div>

          <Modal productId={id} />
        </div>
      </div>

      <div className="flex flex-col gap-16">

        <ProductDescriptionComponent str={product?.description} />

        <Link href={`${product.url}`} target="_blank" className="text-base text-white">
          <button className="btn w-fit mx-auto flex items-center justify-center gap-3 min-w-[200px]">
            <Image
              src="/assets/icons/bag.svg"
              alt="check"
              width={22}
              height={22}
            />
            Buy Now
          </button>
        </Link>
      </div>

      {similarProducts && similarProducts?.length > 0 && (
        <div className="py-14 flex flex-col gap-2 w-full">
          <p className="section-text">Recent Search</p>

          <div className="flex flex-wrap gap-10 mt-7 w-full">
            {similarProducts
              .filter((product) => String(product._id) !== String(id))
              .map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;