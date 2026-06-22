export function EmptyProducts() {
  return (
    <div className="col-span-full mx-auto max-w-md py-16 text-center">
      <p className="font-display text-xl tracking-widest text-rf-dark">NO PRODUCTS FOUND</p>
      <p className="mt-3 text-sm text-muted-foreground">
        Add your first product by telling the chat what you want to sell and the price.
      </p>
    </div>
  );
}