import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

type Manga = Tables<"manga"> & { created_by?: string };
type MangaInsert = TablesInsert<"manga"> & { created_by?: string };
type MangaUpdate = TablesUpdate<"manga"> & { created_by?: string };
type Chapter = Tables<"chapters"> & { created_by?: string };
type ChapterInsert = TablesInsert<"chapters"> & { created_by?: string };

// Helper function to upload file to storage
const uploadFile = async (
  file: File,
  path: string,
  bucket: string = "manga-assets"
): Promise<string> => {
  // Check storage settings from DB
  const { data: storageRow } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'storage')
    .single();
  
  const storage = storageRow?.value as any;
  const provider = storage?.provider || 'supabase';

  const fileExt = file.name.split(".").pop();
  const fileName = `${path}.${fileExt}`;

  if (provider === 'imgbb') {
    const apiKey = storage?.imgbb_api_key;
    if (!apiKey) throw new Error("ImgBB API key is not configured.");

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(`ImgBB upload failed: ${data.error?.message || 'Unknown error'}`);
    }

    return data.data.url;
  }

  if (provider === 'r2') {
    const accountId = storage?.r2_account_id;
    const accessKeyId = storage?.r2_access_key;
    const secretAccessKey = storage?.r2_secret_key;
    const bucketName = storage?.r2_bucket_name;
    let publicUrl = storage?.r2_public_url;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
      throw new Error("Cloudflare R2 is not fully configured. Missing credentials.");
    }

    // Ensure publicUrl does not end with a slash
    if (publicUrl.endsWith('/')) {
      publicUrl = publicUrl.slice(0, -1);
    }

    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: fileName,
          Body: buffer,
          ContentType: file.type,
        })
      );
      
      return `${publicUrl}/${fileName}`;
    } catch (error: any) {
      console.error("R2 Upload Error:", error);
      throw new Error(`Cloudflare R2 upload failed: ${error.message}`);
    }
  }

  // Default to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  return publicUrl;
};

// Helper function to delete file from storage
const deleteFile = async (url: string, bucket: string = "manga-assets") => {
  if (!url) return;
  
  // ImgBB / R2 URLs might not have this pattern, we just skip deletion for them for now
  if (!url.includes(bucket)) return;

  const path = url.split(`${bucket}/`)[1];
  if (!path) return;

  await supabase.storage.from(bucket).remove([path]);
};

// Fetch all manga for admin
export const useAdminManga = () => {
  return useQuery({
    queryKey: ["admin-manga"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("manga")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Manga[];
    },
  });
};

// Fetch chapters for a specific manga
export const useAdminChapters = (mangaId: string | null) => {
  return useQuery({
    queryKey: ["admin-chapters", mangaId],
    queryFn: async () => {
      if (!mangaId) return [];

      const { data, error } = await supabase
        .from("chapters")
        .select("*")
        .eq("manga_id", mangaId)
        .order("number", { ascending: true });

      if (error) throw error;
      return data as Chapter[];
    },
    enabled: !!mangaId,
  });
};

// Create new manga
export const useCreateManga = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      manga,
      coverFile,
      bannerFile,
    }: {
      manga: Omit<MangaInsert, "cover_url"> & { cover_url?: string };
      coverFile?: File;
      bannerFile?: File;
    }) => {
      let cover_url = manga.cover_url || "";
      let banner_url = manga.banner_url;

      // Upload cover image if provided
      if (coverFile) {
        cover_url = await uploadFile(coverFile, `covers/${manga.slug}`);
      }

      // Upload banner image if provided
      if (bannerFile) {
        banner_url = await uploadFile(bannerFile, `banners/${manga.slug}`);
      }

      const { data, error } = await supabase
        .from("manga")
        .insert({ ...manga, cover_url, banner_url, created_by: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-manga"] });
      toast.success("Manga created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create manga: ${error.message}`);
    },
  });
};

// Update existing manga
export const useUpdateManga = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      manga,
      coverFile,
      bannerFile,
      oldCoverUrl,
      oldBannerUrl,
    }: {
      id: string;
      manga: MangaUpdate;
      coverFile?: File;
      bannerFile?: File;
      oldCoverUrl?: string;
      oldBannerUrl?: string;
    }) => {
      let cover_url = manga.cover_url;
      let banner_url = manga.banner_url;

      // Upload new cover if provided
      if (coverFile) {
        if (oldCoverUrl) await deleteFile(oldCoverUrl);
        cover_url = await uploadFile(coverFile, `covers/${manga.slug || id}`);
      }

      // Upload new banner if provided
      if (bannerFile) {
        if (oldBannerUrl) await deleteFile(oldBannerUrl);
        banner_url = await uploadFile(bannerFile, `banners/${manga.slug || id}`);
      }

      const { data, error } = await supabase
        .from("manga")
        .update({ ...manga, cover_url, banner_url })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-manga"] });
      toast.success("Manga updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update manga: ${error.message}`);
    },
  });
};

// Delete manga
export const useDeleteManga = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, coverUrl, bannerUrl }: { id: string; coverUrl?: string; bannerUrl?: string }) => {
      // Delete cover and banner images
      if (coverUrl) await deleteFile(coverUrl);
      if (bannerUrl) await deleteFile(bannerUrl);

      // Delete all chapters and their pages for this manga
      const { data: chapters } = await supabase
        .from("chapters")
        .select("id, pages")
        .eq("manga_id", id);

      if (chapters) {
        for (const chapter of chapters) {
          if (chapter.pages) {
            for (const pageUrl of chapter.pages) {
              await deleteFile(pageUrl);
            }
          }
        }
      }

      const { error } = await supabase.from("manga").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-manga"] });
      toast.success("Manga deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete manga: ${error.message}`);
    },
  });
};

// Create new chapter
export const useCreateChapter = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      chapter,
      pageFiles,
      mangaSlug,
    }: {
      chapter: Partial<ChapterInsert>;
      pageFiles: File[];
      mangaSlug: string;
    }) => {
      const pages: string[] = [];
      // Upload all page images (if any files provided)
      if (pageFiles && pageFiles.length > 0) {
        for (let i = 0; i < pageFiles.length; i++) {
          const file = pageFiles[i];
          const pageUrl = await uploadFile(
            file,
            `chapters/${mangaSlug}/ch${chapter.number}/page${i + 1}`
          );
          pages.push(pageUrl);
        }
      } else if ((chapter as any).pages) {
        // Use provided URLs (Blogger mode)
        pages.push(...(chapter as any).pages);
      }

      const { data, error } = await supabase
        .from("chapters")
        .insert({ ...chapter, pages, created_by: user.id })
        .select()
        .single();

      if (error) throw error;

      // Send Discord notification if configured
      try {
        await supabase.functions.invoke("discord-notify", {
          body: {
            mangaId: chapter.manga_id,
            chapterNumber: chapter.number,
            chapterTitle: chapter.title,
            mangaSlug: mangaSlug,
          },
        });
      } catch (discordError) {
        console.error("Discord notification failed:", discordError);
        // Don't throw - chapter was created successfully, notification is optional
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-chapters", variables.chapter.manga_id] });
      toast.success("Chapter created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create chapter: ${error.message}`);
    },
  });
};

// Update existing chapter
export const useUpdateChapter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      mangaId,
      chapter,
      pageFiles,
      mangaSlug,
      oldPages,
    }: {
      id: string;
      mangaId: string;
      chapter: Partial<Chapter>;
      pageFiles?: File[];
      mangaSlug: string;
      oldPages?: string[];
    }) => {
      let pages = chapter.pages || [];

      // If new page files provided, replace all pages
      if (pageFiles && pageFiles.length > 0) {
        // Delete old pages
        if (oldPages) {
          for (const pageUrl of oldPages) {
            await deleteFile(pageUrl).catch(() => {}); // ignore delete errors
          }
        }

        // Upload new pages
        pages = [];
        for (let i = 0; i < pageFiles.length; i++) {
          const file = pageFiles[i];
          const pageUrl = await uploadFile(
            file,
            `chapters/${mangaSlug}/ch${chapter.number || 'unknown'}/page${i + 1}`
          );
          pages.push(pageUrl);
        }
      } else if (!chapter.pages) {
        // If no files and no change to pages in chapter object, keep existing
        pages = oldPages || [];
      }

      const { data, error } = await supabase
        .from("chapters")
        .update({ ...chapter, pages })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-chapters", variables.mangaId] });
      toast.success("Chapter updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update chapter: ${error.message}`);
    },
  });
};

// Push premium chapter to free (resets created_at)
export const usePushChapterToFree = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, mangaId }: { id: string; mangaId: string }) => {
      const { error } = await supabase
        .from("chapters")
        .update({ premium: false, created_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { mangaId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-chapters", mangaId] });
      queryClient.invalidateQueries({ queryKey: ["all-manga"] });
      toast.success("Chapter pushed to free");
    },
    onError: (error: Error) => {
      toast.error(`Failed to push chapter to free: ${error.message}`);
    },
  });
};

// Bulk push premium chapters to free
export const useBulkPushToFree = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, mangaId }: { ids: string[]; mangaId: string }) => {
      const { error } = await supabase
        .from("chapters")
        .update({ premium: false, created_at: new Date().toISOString() })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_, { mangaId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-chapters", mangaId] });
      queryClient.invalidateQueries({ queryKey: ["all-manga"] });
      toast.success("Chapters pushed to free");
    },
    onError: (error: Error) => {
      toast.error(`Failed to push chapters to free: ${error.message}`);
    },
  });
};

// Delete chapter
export const useDeleteChapter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, mangaId, pages }: { id: string; mangaId: string; pages?: string[] }) => {
      // Delete all page images
      if (pages) {
        for (const pageUrl of pages) {
          await deleteFile(pageUrl);
        }
      }

      const { error } = await supabase.from("chapters").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-chapters", variables.mangaId] });
      toast.success("Chapter deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete chapter: ${error.message}`);
    },
  });
};
