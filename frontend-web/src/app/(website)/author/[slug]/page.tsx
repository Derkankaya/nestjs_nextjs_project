import { getAuthorProfile } from '@/services/user.service';
import { User, Calendar, FileText, Award } from 'lucide-react';
import { notFound } from 'next/navigation';
// 🚨 1. ADIM: Motoru mekana import ettik
import LocalInfinitePostList from '@/components/ui/Local_InfinitePostList';
import Image from 'next/image';

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function AuthorProfilePage(props: PageProps) {
  const params = await props.params;
  const username = params.username;

  let author: any = null;

  try {
    author = await getAuthorProfile(username);
  } catch (error) {
    console.error("Yazar profili çekilemedi:", error);
  }

  if (!author) {
    notFound();
  }

  const joinDate = new Date(author.createdAt).toLocaleDateString('tr-TR', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Yazar Hero Section (Profil Kartı) */}
      <div className="bg-card border rounded-2xl p-8 mb-12 shadow-sm flex flex-col md:flex-row items-center gap-6">
        {/* Avatar */}
        <div className="relative w-28 h-28 rounded-full overflow-hidden bg-muted flex-shrink-0 border-2 border-primary/20">
          {author.avatar ? (
            <Image 
              src={author.avatar} 
              alt={author.name || username} 
              fill 
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-3xl">
              {(author.name || username).charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Yazar Bilgileri */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{author.name}</h1>
            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold w-fit mx-auto md:mx-0">
              <Award className="w-3.5 h-3.5" />
              {author.role || 'Yazar'}
            </span>
          </div>

          <p className="text-muted-foreground text-sm mb-4 max-w-2xl">
            {author.bio || 'Bu yazar henüz bir biyografi eklememiş. Ancak yazdığı harika makaleleri aşağıdan inceleyebilirsiniz!'}
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{joinDate} tarihinde katıldı</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-primary" />
              <span>{author.posts?.length || 0} Yayımlanmış Yazı</span>
            </div>
          </div>
        </div>
      </div>

      {/* Yazarın Yazıları */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight mb-2">Son Yazıları</h2>
        <p className="text-sm text-muted-foreground">Yazarın kaleme aldığı tüm içerikler</p>
      </div>

      {author.posts && author.posts.length > 0 ? (
        /* 🚨 2. ADIM: Koca map döngüsünü sildik, yerine motoru taktık! */
        <LocalInfinitePostList posts={author.posts} itemsPerPage={9} />
      ) : (
        <div className="text-center py-16 bg-muted/20 border border-dashed rounded-xl">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Henüz içerik yok</h3>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            Yazar henüz bir makale yayımlamamış.
          </p>
        </div>
      )}
    </main>
  );
}

export const dynamic = 'force-dynamic';