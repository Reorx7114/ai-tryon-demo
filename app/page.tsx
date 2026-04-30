'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { defaultProducts } from '@/lib/defaultProducts';
import { Product, QuoteItem } from '@/lib/types';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [photo, setPhoto] = useState<string>('');
  const [selected, setSelected] = useState<Product | null>(null);
  const [result, setResult] = useState<string>('');
  const [quote, setQuote] = useState<QuoteItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('products');
    if (saved) setProducts(JSON.parse(saved));
  }, []);

  const quoteText = useMemo(() => quote.map(i => `${i.name} x${i.qty} - NT$${i.price * i.qty}`).join('\n'), [quote]);

  const generateMock = () => {
    if (!photo || !selected) return alert('請先上傳照片並選擇商品');
    setResult(`https://picsum.photos/seed/tryon-${selected.id}/700/900`);
  };

  const addQuote = () => {
    if (!selected) return;
    setQuote(prev => {
      const found = prev.find(i => i.id === selected.id);
      if (found) return prev.map(i => i.id === selected.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...selected, qty: 1 }];
    });
  };

  return <div className="space-y-6">
    <header className="flex items-center justify-between"><h1 className="text-2xl font-bold">AI 換裝成交輔助工具</h1><Link href="/admin" className="text-blue-600">前往後台</Link></header>
    <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setPhoto(String(r.result)); r.readAsDataURL(f); }} />
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{products.map(p => <button key={p.id} onClick={() => setSelected(p)} className={`rounded border p-3 text-left ${selected?.id===p.id?'border-blue-500':'border-slate-300'}`}><img src={p.image} className="mb-2 h-48 w-full rounded object-cover"/><p className="font-semibold">{p.name}</p><p>NT${p.price}</p></button>)}</div>
    <div className="flex gap-2"><button onClick={generateMock} className="rounded bg-blue-600 px-4 py-2 text-white">產生試穿結果（Mock）</button><button onClick={addQuote} className="rounded bg-slate-800 px-4 py-2 text-white">加入詢價單</button><button onClick={() => navigator.clipboard.writeText(quoteText || '目前無詢價品項')} className="rounded border px-4 py-2">複製詢價內容</button></div>
    <div className="grid gap-4 md:grid-cols-2">{photo && <img src={photo} className="rounded"/>}{result && <img src={result} className="rounded"/>}</div>
    <pre className="rounded bg-white p-3 shadow">{quoteText || '尚未加入詢價商品'}</pre>
  </div>;
}
