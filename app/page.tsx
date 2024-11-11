// pages/index.js

import ProductTable from "@/components/dashboard/ProductTable";

const Page = async () => {
  const response = await fetch(
    "http://ec2-54-174-164-111.compute-1.amazonaws.com/api/tokens"
  );
  const products = await response.json();

  return (
    <div>
      <ProductTable products={products} />
    </div>
  );
};

export default Page;
