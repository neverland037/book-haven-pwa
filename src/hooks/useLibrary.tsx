import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { generateFileHash, storeEpubFile, getEpubFile, deleteEpubFile } from '@/lib/db';
import { extractMetadata, createCoverThumbnail } from '@/lib/epub-utils';
import { useToast } from '@/hooks/use-toast';

export interface Book {
  id: string;
  user_id: string;
  book_hash: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  current_location: string | null;
  progress_percentage: number;
  is_favorite: boolean;
  collection_name: string | null;
  created_at: string;
  updated_at: string;
}

export function useLibrary() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch user's library
  const { data: books, isLoading, error } = useQuery({
    queryKey: ['library'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Book[];
    },
  });

  // Add book mutation
  const addBookMutation = useMutation({
    mutationFn: async (file: File) => {
      // Generate hash
      const hash = await generateFileHash(file);

      // Check if book already exists
      const { data: existing } = await supabase
        .from('user_library')
        .select('id')
        .eq('book_hash', hash)
        .maybeSingle();

      if (existing) {
        throw new Error('Este libro ya está en tu biblioteca');
      }

      // Extract metadata
      const metadata = await extractMetadata(file);

      // Create thumbnail if cover exists
      let coverBase64: string | undefined;
      if (metadata.coverUrl) {
        coverBase64 = await createCoverThumbnail(metadata.coverUrl);
      }

      // Store file in IndexedDB
      await storeEpubFile(hash, file);

      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      // Create record in Supabase
      const { data, error } = await supabase
        .from('user_library')
        .insert({
          user_id: user.id,
          book_hash: hash,
          title: metadata.title,
          author: metadata.author,
          cover_url: coverBase64 || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Book;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
      toast({
        title: 'Libro añadido',
        description: 'El libro se ha agregado correctamente a tu biblioteca',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update book progress
  const updateProgressMutation = useMutation({
    mutationFn: async ({
      bookId,
      location,
      percentage,
    }: {
      bookId: string;
      location: string;
      percentage: number;
    }) => {
      const { error } = await supabase
        .from('user_library')
        .update({
          current_location: location,
          progress_percentage: percentage,
        })
        .eq('id', bookId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });

  // Toggle favorite
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ bookId, isFavorite }: { bookId: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from('user_library')
        .update({ is_favorite: isFavorite })
        .eq('id', bookId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });

  // Delete book
  const deleteBookMutation = useMutation({
    mutationFn: async (book: Book) => {
      // Delete from Supabase
      const { error } = await supabase
        .from('user_library')
        .delete()
        .eq('id', book.id);

      if (error) throw error;

      // Delete from IndexedDB
      await deleteEpubFile(book.book_hash);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] });
      toast({
        title: 'Libro eliminado',
        description: 'El libro se ha eliminado de tu biblioteca',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el libro',
        variant: 'destructive',
      });
    },
  });

  return {
    books: books || [],
    isLoading,
    error,
    addBook: addBookMutation.mutate,
    isAdding: addBookMutation.isPending,
    updateProgress: updateProgressMutation.mutate,
    toggleFavorite: toggleFavoriteMutation.mutate,
    deleteBook: deleteBookMutation.mutate,
  };
}
