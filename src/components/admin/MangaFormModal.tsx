import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateManga, useUpdateManga } from "@/hooks/useManga";
import { Tables } from "@/integrations/supabase/types";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

type Manga = Tables<"manga">;

const mangaFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  type: z.enum(["manga", "manhwa", "manhua"]),
  status: z.enum(["ongoing", "completed", "hiatus", "season end", "cancelled"]),
  author: z.string().min(1, "Author is required"),
  artist: z.string().min(1, "Artist is required"),
  description: z.string().min(1, "Description is required"),
  rating: z.number().min(0).max(10).optional(),
  released: z.number().min(1900).max(2100),
  genres: z.string(),
  premium: z.boolean(),
  pinned: z.boolean(),
  featured: z.boolean(),
  trending: z.boolean(),
});

type MangaFormValues = z.infer<typeof mangaFormSchema>;

interface MangaFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manga?: Manga;
}

export const MangaFormModal = ({ open, onOpenChange, manga }: MangaFormModalProps) => {
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [bannerPreview, setBannerPreview] = useState<string>("");

  const createManga = useCreateManga();
  const updateManga = useUpdateManga();

  const form = useForm<MangaFormValues>({
    resolver: zodResolver(mangaFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      type: "manga",
      status: "ongoing",
      author: "",
      artist: "",
      description: "",
      rating: 0,
      released: new Date().getFullYear(),
      genres: "",
      premium: false,
      pinned: false,
      featured: false,
      trending: false,
    },
  });

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    if (!manga) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      form.setValue("slug", slug);
    }
  };

  // Load manga data when editing
  useEffect(() => {
    if (manga) {
      form.reset({
        title: manga.title,
        slug: manga.slug,
        type: manga.type as "manga" | "manhwa" | "manhua",
        status: manga.status as "ongoing" | "completed" | "hiatus",
        author: manga.author,
        artist: manga.artist,
        description: manga.description,
        rating: manga.rating || 0,
        released: manga.released,
        genres: manga.genres?.join(", ") || "",
        premium: manga.premium || false,
        pinned: manga.pinned || false,
        featured: manga.featured || false,
        trending: manga.trending || false,
      });
      setCoverPreview(manga.cover_url);
      setBannerPreview(manga.banner_url || "");
    } else {
      form.reset();
      setCoverPreview("");
      setBannerPreview("");
    }
  }, [manga, form]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (values: MangaFormValues) => {
    const mangaData = {
      title: values.title,
      slug: values.slug,
      type: values.type,
      status: values.status,
      author: values.author,
      artist: values.artist,
      description: values.description,
      rating: values.rating || 0,
      released: values.released,
      genres: values.genres.split(",").map((g) => g.trim()).filter(Boolean),
      alt_titles: [],
      premium: values.premium,
      pinned: values.pinned,
      featured: values.featured,
      trending: values.trending,
      cover_url: manga?.cover_url || "",
      banner_url: manga?.banner_url,
    };

    if (manga) {
      await updateManga.mutateAsync({
        id: manga.id,
        manga: mangaData,
        coverFile: coverFile || undefined,
        bannerFile: bannerFile || undefined,
        oldCoverUrl: manga.cover_url,
        oldBannerUrl: manga.banner_url || undefined,
      });
    } else {
      await createManga.mutateAsync({
        manga: mangaData,
        coverFile: coverFile || undefined,
        bannerFile: bannerFile || undefined,
      });
    }

    onOpenChange(false);
    form.reset();
    setCoverFile(null);
    setBannerFile(null);
    setCoverPreview("");
    setBannerPreview("");
  };

  const isLoading = createManga.isPending || updateManga.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{manga ? "Edit Manga" : "Add New Manga"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleTitleChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!!manga} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="manga">Manga</SelectItem>
                        <SelectItem value="manhwa">Manhwa</SelectItem>
                        <SelectItem value="manhua">Manhua</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="hiatus">Hiatus</SelectItem>
                        <SelectItem value="season end">Season End</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Author</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="artist"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artist</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating (0-10)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="released"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Release Year</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="genres"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Genres (comma-separated)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Action, Adventure, Fantasy" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Cover Image</FormLabel>
              <Input type="file" accept="image/*" onChange={handleCoverChange} />
              {coverPreview && (
                <img src={coverPreview} alt="Cover preview" className="w-32 h-48 object-cover rounded" />
              )}
            </div>

            <div className="space-y-2">
              <FormLabel>Banner Image (optional)</FormLabel>
              <Input type="file" accept="image/*" onChange={handleBannerChange} />
              {bannerPreview && (
                <img src={bannerPreview} alt="Banner preview" className="w-full h-32 object-cover rounded" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="premium"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel>Premium</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pinned"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel>Pinned</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel>Featured</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="trending"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel>Trending</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {manga ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
