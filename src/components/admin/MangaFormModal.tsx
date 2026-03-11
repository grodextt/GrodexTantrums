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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateManga, useUpdateManga } from "@/hooks/useManga";
import { Tables } from "@/integrations/supabase/types";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

type Manga = Tables<"manga">;

const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", 
  "Romance", "Sci-Fi", "Slice of Life", "Supernatural", "Thriller", "Tragedy",
  "Psychological", "Historical", "Isekai", "Mecha", "Sports", "Martial Arts",
  "School Life", "Seinen", "Shounen", "Shoujo", "Josei", "Ecchi", "Harem",
  "Yaoi", "Yuri", "Magic", "Military", "Music", "Parody", "Police",
  "Post-Apocalyptic", "Reincarnation", "Revenge", "Survival", "Time Travel",
  "Vampire", "Zombies", "Cyberpunk", "Cooking", "Medical", "Crime", "Detective"
];

const CONTENT_WARNINGS = [
  "Gore", "Graphic Violence", "Sexual Content", "Strong Language",
  "Drug Use", "Suicide/Self Harm", "Disturbing Content", "Animal Cruelty"
];

const mangaFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  alt_titles: z.string().optional(),
  type: z.enum(["manga", "manhwa", "manhua"]),
  status: z.enum(["ongoing", "completed", "hiatus", "season end", "cancelled"]),
  author: z.string().min(1, "Author is required"),
  artist: z.string().min(1, "Artist is required"),
  description: z.string().min(1, "Description is required"),
  rating: z.number().min(0).max(10).optional(),
  released: z.number().min(1900).max(2100),
  genres: z.array(z.string()).min(1, "Select at least one genre"),
  content_warnings: z.array(z.string()),
  pinned: z.boolean(),
  featured: z.boolean(),
  trending: z.boolean(),
  discord_enabled: z.boolean(),
  discord_webhook_url: z.string().optional(),
  discord_channel_name: z.string().optional(),
  discord_primary_role_id: z.string().optional(),
  discord_secondary_role_id: z.string().optional(),
  discord_notification_template: z.string().optional(),
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
      alt_titles: "",
      description: "",
      rating: 0,
      released: new Date().getFullYear(),
      genres: [],
      content_warnings: [],
      pinned: false,
      featured: false,
      trending: false,
      discord_enabled: false,
      discord_webhook_url: "https://discord.com/api/webhooks/1410909744855515197/P8ne4BD5HkS1QDCcHMMg5h6sjzHvDhc-K7BfGWv78HzXQil-hJWBQNLYrdHl-jezxXn8",
      discord_channel_name: "",
      discord_primary_role_id: "784110780672638996",
      discord_secondary_role_id: "",
      discord_notification_template: "New chapter released: {manga_title} - Chapter {chapter_number}: {chapter_title}\nRead now: {chapter_url}",
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
        alt_titles: (manga.alt_titles || []).join('\n'),
        type: manga.type as "manga" | "manhwa" | "manhua",
        status: manga.status as "ongoing" | "completed" | "hiatus" | "season end" | "cancelled",
        author: manga.author,
        artist: manga.artist,
        description: manga.description,
        rating: manga.rating || 0,
        released: manga.released,
        genres: manga.genres || [],
        content_warnings: (manga as any).content_warnings || [],
        pinned: manga.pinned || false,
        featured: manga.featured || false,
        trending: manga.trending || false,
        discord_enabled: !!(manga as any).discord_webhook_url,
        discord_webhook_url: (manga as any).discord_webhook_url || "",
        discord_channel_name: (manga as any).discord_channel_name || "",
        discord_primary_role_id: (manga as any).discord_primary_role_id || "",
        discord_secondary_role_id: (manga as any).discord_secondary_role_id || "",
        discord_notification_template: (manga as any).discord_notification_template || "New chapter released: {manga_title} - Chapter {chapter_number}: {chapter_title}",
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
      genres: values.genres,
      alt_titles: (values.alt_titles || '').split('\n').map(t => t.trim()).filter(Boolean),
      pinned: values.pinned,
      featured: values.featured,
      trending: values.trending,
      cover_url: manga?.cover_url || "",
      banner_url: manga?.banner_url,
      content_warnings: values.content_warnings,
      discord_webhook_url: values.discord_enabled ? values.discord_webhook_url : null,
      discord_channel_name: values.discord_enabled ? values.discord_channel_name : null,
      discord_primary_role_id: values.discord_enabled ? values.discord_primary_role_id : null,
      discord_secondary_role_id: values.discord_enabled ? values.discord_secondary_role_id : null,
      discord_notification_template: values.discord_enabled ? values.discord_notification_template : null,
    } as any;

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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{manga ? "Edit Manga" : "Add New Manga"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="classification">Classification</TabsTrigger>
                <TabsTrigger value="discord">Discord Notifications</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
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

                <FormField
                  control={form.control}
                  name="alt_titles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alternative Titles (one per line)</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} placeholder={"e.g.\n나 혼자만 레벨업\nSolo Leveling"} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />


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

                <div className="grid grid-cols-3 gap-4">
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
                        <FormLabel>Editor's Choice</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="classification" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="genres"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">Genres</FormLabel>
                      </div>
                      <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto p-4 border rounded-lg">
                        {GENRES.map((genre) => (
                          <FormField
                            key={genre}
                            control={form.control}
                            name="genres"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={genre}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(genre)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, genre])
                                          : field.onChange(
                                              field.value?.filter((value) => value !== genre)
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {genre}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content_warnings"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel className="text-base">Content Warnings</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Users will see a warning popup when visiting this manga
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg">
                        {CONTENT_WARNINGS.map((warning) => (
                          <FormField
                            key={warning}
                            control={form.control}
                            name="content_warnings"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={warning}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(warning)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, warning])
                                          : field.onChange(
                                              field.value?.filter((value) => value !== warning)
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {warning}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="discord" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="discord_enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Discord Notifications</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Send notifications to Discord when new chapters are added
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("discord_enabled") && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="discord_webhook_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Webhook URL</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="https://discord.com/api/webhooks/..."
                            />
                          </FormControl>
                          <p className="text-sm text-muted-foreground">
                            Get this from Discord Server Settings → Integrations → Webhooks
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="discord_channel_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Channel Name (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="announcements"
                            />
                          </FormControl>
                          <p className="text-sm text-muted-foreground">
                            Display name of the channel in notification footer
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="discord_primary_role_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Role ID (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="784110782341185577"
                              />
                            </FormControl>
                            <p className="text-sm text-muted-foreground">
                              Role to ping for new chapters
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="discord_secondary_role_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Secondary Role ID (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="784110780672638996"
                              />
                            </FormControl>
                            <p className="text-sm text-muted-foreground">
                              Additional role to ping
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="discord_notification_template"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notification Template</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={3}
                              placeholder="New chapter released: {manga_title} - Chapter {chapter_number}: {chapter_title}"
                            />
                          </FormControl>
                          <p className="text-sm text-muted-foreground">
                            Available variables: {"{manga_title}"}, {"{chapter_number}"}, {"{chapter_title}"}, {"{chapter_url}"}
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <p className="text-sm font-medium">ℹ️ How it works</p>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Notifications are sent automatically when you add a new chapter</li>
                        <li>Role IDs can be found by right-clicking a role in Discord (enable Developer Mode)</li>
                        <li>Template variables will be replaced with actual manga/chapter data</li>
                      </ul>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

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