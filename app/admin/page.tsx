'use client';
import { useEffect, useState } from 'react';
import { defaultProducts } from '@/lib/defaultProducts';
import { Product } from '@/lib/types';

const PASSWORD = 'admin123';

export default function AdminPage() {
  const [ok, setOk] = useState(false);
  const [pass, setPass] = useState('');
  const [products, setProducts] = useState<Product[]>(defaultProducts);

  useEffect(() => {
    const saved = localStorage.getItem('products');
    if (saved) setProducts(JSON.parse(saved));
  }, []);

  const save = (next: Product[]) => { setProducts(next); localStorage.setItem('products', JSON.stringify(next)); };
  if (!ok) return <div className="mx-auto mt-20 max-w-sm space-y-2"><h1 className="text-xl font-bold">後台登入</h1><input className="w-full rounded border p-2" type="password" value={pass} onChange={e=>setPass(e.target.value)}/><button className="rounded bg-blue-600 px-4 py-2 text-white" onClick={() => setOk(pass===PASSWORD)}>{'登入'}</button></div>;

  return <div className="space-y-3"><h1 className="text-2xl font-bold">商品管理</h1><button className="rounded bg-emerald-600 px-3 py-2 text-white" onClick={()=>save([...products,{id:crypto.randomUUID(),name:'新商品',price:1000,image:'https://picsum.photos/seed/new/400/500',description:'待補'}])}>新增商品</button>{products.map(p => <div key={p.id} className="grid gap-2 rounded bg-white p-3 shadow"><input className="rounded border p-2" value={p.name} onChange={e=>save(products.map(i=>i.id===p.id?{...i,name:e.target.value}:i))}/><input className="rounded border p-2" type="number" value={p.price} onChange={e=>save(products.map(i=>i.id===p.id?{...i,price:+e.target.value}:i))}/><input className="rounded border p-2" value={p.description} onChange={e=>save(products.map(i=>i.id===p.id?{...i,description:e.target.value}:i))}/><input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>save(products.map(i=>i.id===p.id?{...i,image:String(r.result)}:i));r.readAsDataURL(f);}}/><img src={p.image} className="h-40 w-32 rounded object-cover"/><button className="rounded bg-rose-600 px-3 py-1 text-white" onClick={()=>save(products.filter(i=>i.id!==p.id))}>刪除</button></div>)}</div>;
}
