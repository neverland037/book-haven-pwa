import { Layout } from '@/components/Layout';
import { useLibrary } from '@/hooks/useLibrary';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, BookOpen, Heart } from 'lucide-react';
import { useRef } from 'react';

const Index = () => {
  const { books, isLoading, addBook, isAdding } = useLibrary();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.epub')) {
      addBook(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 safe-bottom">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Mi Biblioteca</h2>
          <p className="text-muted-foreground">
            {books.length === 0 
              ? 'Comienza agregando tu primer libro' 
              : `${books.length} ${books.length === 1 ? 'libro' : 'libros'} en tu biblioteca`}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Cargando biblioteca...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && books.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-muted rounded-full p-6 mb-4">
              <BookOpen className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Tu biblioteca está vacía</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Agrega tu primer libro en formato EPUB para comenzar tu viaje de lectura
            </p>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isAdding}
              size="lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              {isAdding ? 'Agregando...' : 'Agregar Libro'}
            </Button>
          </div>
        )}

        {/* Books Grid */}
        {!isLoading && books.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {books.map((book) => (
              <Card 
                key={book.id} 
                className="group hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  // TODO: Navigate to reader
                }}
              >
                <CardContent className="p-0">
                  <div className="aspect-[2/3] relative overflow-hidden rounded-t-lg">
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    {book.is_favorite && (
                      <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1.5">
                        <Heart className="h-4 w-4 text-destructive fill-destructive" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm line-clamp-2 mb-1">
                      {book.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {book.author || 'Autor desconocido'}
                    </p>
                    {book.progress_percentage > 0 && (
                      <div className="mt-2">
                        <div className="h-1 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ width: `${book.progress_percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* FAB Button */}
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isAdding}
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg safe-bottom hover:scale-105 transition-transform"
        >
          {isAdding ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-foreground" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </Button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".epub"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    </Layout>
  );
};

export default Index;
