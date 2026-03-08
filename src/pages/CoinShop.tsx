import { ShoppingCart } from 'lucide-react';

export default function CoinShop() {
  return (
    <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 py-10">
      <div className="flex items-center gap-3 mb-8">
        <ShoppingCart className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Coin Shop</h1>
      </div>
      <p className="text-muted-foreground">Coming soon — purchase coins and unlock premium chapters.</p>
    </div>
  );
}
