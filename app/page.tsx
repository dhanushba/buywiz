import HeroCarousel from "@/components/HeroCarousel"
import Searchbar from "@/components/Searchbar"
import Image from "next/image"
import { getAllProducts } from "@/lib/actions"
import ProductCard from "@/components/ProductCard"
import User_Modal from "@/components/UserSignup_Modal"
import { cookies } from "next/headers";
import { connectToDB } from "@/lib/mongoose"
import Product from "@/lib/models/product.model"
import SearchSection from "@/components/SearchSection"


const Home = async () => {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get("user_email")?.value;
  console.log(userEmail);
  let allProducts = [];
  if(userEmail){
    const ProductIds = await getAllProducts(userEmail);
    // console.log(ProductIds);
    if (ProductIds.length > 0) {
      connectToDB();
      allProducts = await Product.find({ _id: { $in: ProductIds } });
      // console.log("Fetched Products:", allProducts);
    }
  }

  return (
    <>
      <section className="px-6 md:px-20 py-24">
        <div className="flex max-xl:flex-col gap-16">
          <div className="flex flex-col justify-center">
            <p className="small-text">
              Smart Shopping Starts Here:
              <Image
                src="/assets/icons/arrow-right.svg"
                alt="arrow-right"
                width={16}
                height={16}
              />
            </p>

            <h1 className="head-text">
              Unleash the Power of
              <span className="text-primary"> BuyWiz</span>
            </h1>

            <p className="mt-6">
              Powerful, self-serve product and growth analytics to help you convert, engage, and retain more.
            </p>

            <Searchbar />
          </div>

          <HeroCarousel />
        </div>
        <User_Modal />
      </section>

      <SearchSection />

      <section className="trending-section">
        <h2 className="section-text">Recent Search</h2>

        <div className="flex flex-wrap gap-x-8 gap-y-16">
          {allProducts?.map((product) => (          
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>
      </> 
  )
}

export default Home