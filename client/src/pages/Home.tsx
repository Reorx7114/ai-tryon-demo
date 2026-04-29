import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Camera, CheckCircle2, Download, ImagePlus, Loader2, RefreshCw, Shirt, Sparkles } from "lucide-react";
import { useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { toast } from "sonner";

type PreviewState = {
  file?: File;
  dataUrl?: string;
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function UploadCard({
  title,
  description,
  icon,
  preview,
  onChange,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  preview: PreviewState;
  onChange: (next: PreviewState) => void;
}) {
  const id = useMemo(() => `upload-${title.replace(/\s+/g, "-")}`, [title]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("請上傳圖片檔");
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    onChange({ file, dataUrl });
  }

  return (
    <Card className="overflow-hidden border-dashed bg-white/80 shadow-sm">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="rounded-xl bg-orange-100 p-2 text-orange-700">{icon}</div>
          <div>
            <h3 className="font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>

        <Label
          htmlFor={id}
          className="flex aspect-[4/5] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 transition hover:bg-orange-50"
        >
          {preview.dataUrl ? (
            <img src={preview.dataUrl} alt={title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-3 text-center text-slate-500">
              <ImagePlus className="size-10" />
              <span className="text-sm">點擊上傳圖片</span>
            </div>
          )}
        </Label>
        <Input id={id} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [person, setPerson] = useState<PreviewState>({});
  const [clothing, setClothing] = useState<PreviewState>({});
  const [productName, setProductName] = useState("Korean Slim-Fit Knit Top");
  const [styleNote, setStyleNote] = useState("Keep the product silhouette and color. Make the outfit look natural, realistic, and not overly distorted.");
  const [resultUrl, setResultUrl] = useState<string>();
  const [providerMessage, setProviderMessage] = useState<string>();

  const generateMutation = trpc.tryOn.generate.useMutation({
    onSuccess: (result) => {
      setResultUrl(result.imageUrl);
      setProviderMessage(result.message);
      if (result.demoMode) {
        toast.warning("目前使用 Demo 模式，流程可跑；接上 API Key 後會產生真圖。");
      } else {
        toast.success("試穿圖已生成");
      }
    },
    onError: (error) => {
      toast.error(error.message || "生成失敗，請稍後再試");
    },
  });

  const canGenerate = Boolean(person.dataUrl && clothing.dataUrl && productName.trim()) && !generateMutation.isPending;

  function handleGenerate() {
    if (!person.dataUrl || !clothing.dataUrl) {
      toast.error("請先上傳人物照與衣服圖");
      return;
    }

    generateMutation.mutate({
      personImage: person.dataUrl,
      clothingImage: clothing.dataUrl,
      productName: productName.trim(),
      styleNote: styleNote.trim(),
    });
  }

  function handleReset() {
    setPerson({});
    setClothing({});
    setResultUrl(undefined);
    setProviderMessage(undefined);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-100 text-slate-950">
      <section className="container py-8 md:py-12">
        <div className="mb-8 grid gap-6 md:grid-cols-[1.25fr_0.75fr] md:items-end">
          <div>
            <Badge className="mb-4 bg-orange-100 text-orange-800 hover:bg-orange-100">Korean Fashion AI Try-On</Badge>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
              AI Try-On for Korean Fashion｜See the outfit before buying
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              Upload a customer photo and preview how the selected Korean fashion item may look when worn. Built for product pages, social selling, and reducing purchase hesitation.
            </p>
            <div className="mt-5 grid max-w-2xl gap-3 text-sm text-slate-600 sm:grid-cols-3">
              <div className="rounded-2xl border bg-white/70 p-3">1. Upload photo</div>
              <div className="rounded-2xl border bg-white/70 p-3">2. Select outfit</div>
              <div className="rounded-2xl border bg-white/70 p-3">3. Preview & shop</div>
            </div>
            <p className="mt-4 text-sm text-slate-500">🔒 Photos are used only for this try-on preview and are not stored in this MVP demo.</p>
          </div>

          <Card className="border-orange-100 bg-white/80 shadow-sm">
            <CardContent className="space-y-3 p-5 text-sm text-slate-600">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <CheckCircle2 className="size-5 text-orange-600" />
                Ready for product demo
              </div>
              <p>Photo upload, outfit image input, try-on button, result preview, AI backend entry, and demo fallback are ready.</p>
              <p className="rounded-xl bg-slate-50 p-3 text-xs">
                Live AI generation: add <span className="font-mono">OPENAI_API_KEY</span> and restart the app.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="grid gap-6 md:grid-cols-2">
            <UploadCard
              title="Customer Photo"
              description="Front-facing customer or model photo"
              icon={<Camera className="size-5" />}
              preview={person}
              onChange={setPerson}
            />
            <UploadCard
              title="Product Image"
              description="Flat lay, white background, or product photo"
              icon={<Shirt className="size-5" />}
              preview={clothing}
              onChange={setClothing}
            />
          </div>

          <Card className="bg-white/90 shadow-sm">
            <CardContent className="space-y-5 p-5">
              <div>
                <h2 className="text-xl font-bold">Try-On Settings</h2>
                <p className="mt-1 text-sm text-slate-500">A simple flow designed for fashion product testing.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="productName">Product Name</Label>
                <Input id="productName" value={productName} onChange={(event) => setProductName(event.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="styleNote">Try-On Requirement</Label>
                <Textarea
                  id="styleNote"
                  value={styleNote}
                  onChange={(event) => setStyleNote(event.target.value)}
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleGenerate} disabled={!canGenerate} className="h-11 bg-orange-600 hover:bg-orange-700">
                  {generateMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
                  Try Now
                </Button>
                <Button variant="outline" onClick={handleReset} className="h-11">
                  <RefreshCw className="mr-2 size-4" />
                  Reset
                </Button>
              </div>

              {providerMessage && <p className="rounded-xl bg-orange-50 p-3 text-sm text-orange-800">{providerMessage}</p>}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 bg-white/90 shadow-sm">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Try-On Preview</h2>
                <p className="mt-1 text-sm text-slate-500">The preview will appear here. Download it for product review, sales discussion, or internal testing.</p>
                <p className="mt-1 text-xs text-slate-400">AI try-on is for preview only. Actual fit and color may vary.</p>
              </div>
              {resultUrl && (
                <Button variant="outline" asChild>
                  <a href={resultUrl} download="ai-try-on-result.png">
                    <Download className="mr-2 size-4" />
                    Download
                  </a>
                </Button>
              )}
            </div>

            <div className="flex min-h-[420px] items-center justify-center overflow-hidden rounded-3xl border bg-slate-50">
              {generateMutation.isPending ? (
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <Loader2 className="size-10 animate-spin text-orange-600" />
                  <p>正在Try Now圖...</p>
                </div>
              ) : resultUrl ? (
                <img src={resultUrl} alt="AI try-on result" className="max-h-[720px] w-full object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-3 text-center text-slate-500">
                  <Sparkles className="size-12 text-orange-500" />
                  <p>Upload a customer photo and product image, then click Try Now.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
