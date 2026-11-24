import {ChevronUp, MoreHorizontal, Plus} from 'lucide-react';
import {ChangeEvent, FormEvent, useEffect, useMemo, useState} from 'react';
import {COVER_IMAGES, DEFAULT_AUTHOR_PROFILES} from '../data/books';
import {AuthorProfile, Book} from '../types/book';
import {readImageFileAsDataUrl} from '../utils/imageUpload';
import {Profile, ProfileIcon, ProfileSelector} from './ui/profile-selector';

interface AuthorProfileSectionProps {
  books: Book[];
  authorProfiles: AuthorProfile[];
  hiddenAuthorNames: string[];
  sectionTitle: string;
  onChangeSectionTitle: (next: string) => void;
  onAddAuthorProfile: (profile: AuthorProfile) => void;
  onUpdateAuthorProfile: (updated: AuthorProfile, previousName?: string) => void;
  onDeleteAuthorProfile: (profile: AuthorProfile) => void;
  onResetAuthorProfiles: () => void;
  onSelectAuthor: (authorName: string) => void;
}

interface AuthorEditCardProps {
  profile: AuthorProfile;
  onUpdate: (updated: AuthorProfile, previousName?: string) => void;
  onDelete: (profile: AuthorProfile) => void;
  onUploadAvatar: (profile: AuthorProfile, e: ChangeEvent<HTMLInputElement>) => void;
}

function AuthorEditCard({profile, onUpdate, onDelete, onUploadAvatar}: AuthorEditCardProps) {
  const [draftName, setDraftName] = useState(profile.name);
  const [draftAvatar, setDraftAvatar] = useState(profile.avatar);

  useEffect(() => {
    setDraftName(profile.name);
  }, [profile.name]);

  useEffect(() => {
    setDraftAvatar(profile.avatar);
  }, [profile.avatar]);

  const commitName = () => {
    const trimmed = draftName.trim();
    if (!trimmed) {
      setDraftName(profile.name);
      return;
    }
    if (trimmed !== profile.name) {
      onUpdate({...profile, name: trimmed, avatar: draftAvatar.trim() || profile.avatar}, profile.name);
    }
  };

  return (
    <div className="p-3 rounded-lg bg-dark-surface border border-dark-outline-variant flex items-center gap-3">
      <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border border-dark-outline-variant bg-dark-surface-container">
        <img
          src={draftAvatar || profile.avatar}
          alt={profile.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <input
          type="text"
          aria-label={`Tên tác giả ${profile.name}`}
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              (e.currentTarget as HTMLInputElement).blur();
            }
          }}
          placeholder="Tên tác giả..."
          className="w-full rounded-md border border-dark-outline-variant bg-dark-surface-container px-2.5 py-1 text-body-sm text-light-surface-bright focus:border-kale-pink focus:outline-none"
        />
        <div className="flex items-center gap-1.5">
          <input
            type="url"
            aria-label={`URL ảnh của ${profile.name}`}
            value={draftAvatar}
            onChange={(e) => {
              const nextAvatar = e.target.value;
              setDraftAvatar(nextAvatar);
              onUpdate({...profile, name: draftName.trim() || profile.name, avatar: nextAvatar}, profile.name);
            }}
            placeholder="https://..."
            className="flex-1 min-w-0 rounded-md border border-dark-outline-variant bg-dark-surface-container px-2.5 py-1 text-[12px] text-dark-on-surface focus:border-kale-pink focus:outline-none"
          />
          <label className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-dark-surface-container border border-dark-outline-variant text-[11px] font-label text-dark-on-surface hover:border-kale-pink hover:text-kale-pink cursor-pointer flex-shrink-0">
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
              upload
            </span>
            <span>Tải ảnh</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onUploadAvatar({...profile, name: draftName.trim() || profile.name}, e)}
              className="hidden"
            />
          </label>
          <button
            type="button"
            aria-label={`Xoá tác giả ${profile.name}`}
            title={`Xoá tác giả ${profile.name}`}
            onClick={() => onDelete(profile)}
            className="w-7 h-7 rounded-md bg-dark-error-container text-dark-on-error-container flex items-center justify-center hover:opacity-90 cursor-pointer flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[15px]">delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function useAuthorGridColumns(): number {
  const getColumns = () => {
    if (typeof window === 'undefined') return 4;
    if (window.matchMedia('(min-width: 768px)').matches) return 4;
    if (window.matchMedia('(min-width: 640px)').matches) return 3;
    return 2;
  };

  const [columns, setColumns] = useState<number>(getColumns);

  useEffect(() => {
    const update = () => setColumns(getColumns());
    const mqMd = window.matchMedia('(min-width: 768px)');
    const mqSm = window.matchMedia('(min-width: 640px)');
    mqMd.addEventListener('change', update);
    mqSm.addEventListener('change', update);
    return () => {
      mqMd.removeEventListener('change', update);
      mqSm.removeEventListener('change', update);
    };
  }, []);

  return columns;
}

export function AuthorProfileSection({
  books,
  authorProfiles,
  hiddenAuthorNames,
  sectionTitle,
  onChangeSectionTitle,
  onAddAuthorProfile,
  onUpdateAuthorProfile,
  onDeleteAuthorProfile,
  onResetAuthorProfiles,
  onSelectAuthor,
}: AuthorProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isAuthorsExpanded, setIsAuthorsExpanded] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState(COVER_IMAGES[0]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const columns = useAuthorGridColumns();
  const maxCollapsedSlots = columns * 2; // Strictly 2 rows when collapsed

  // Merge stored authorProfiles with non-hidden authors from books
  const mergedProfiles = useMemo(() => {
    const hiddenSet = new Set(hiddenAuthorNames.map((n) => n.trim().toLowerCase()));
    const result: AuthorProfile[] = authorProfiles.filter(
      (p) => !hiddenSet.has(p.name.trim().toLowerCase()),
    );
    const seen = new Set(result.map((p) => p.name.trim().toLowerCase()));

    books.forEach((book, idx) => {
      const cleanName = book.author?.trim();
      if (!cleanName) return;
      const key = cleanName.toLowerCase();
      if (!seen.has(key) && !hiddenSet.has(key)) {
        seen.add(key);
        result.push({
          id: `book_author_${idx}_${key}`,
          name: cleanName,
          avatar: book.image || COVER_IMAGES[idx % COVER_IMAGES.length],
        });
      }
    });

    return result;
  }, [authorProfiles, books, hiddenAuthorNames]);

  const maxVisibleAuthorsCollapsed = Math.max(1, maxCollapsedSlots - 1);
  const hasOverflow = mergedProfiles.length > maxVisibleAuthorsCollapsed;
  const hiddenCount = Math.max(0, mergedProfiles.length - maxVisibleAuthorsCollapsed);

  const visibleAuthorProfiles = useMemo(() => {
    if (!hasOverflow || isAuthorsExpanded) return mergedProfiles;
    return mergedProfiles.slice(0, maxVisibleAuthorsCollapsed);
  }, [mergedProfiles, hasOverflow, isAuthorsExpanded, maxVisibleAuthorsCollapsed]);

  const selectorProfiles: Profile[] = useMemo(() => {
    const items: Profile[] = visibleAuthorProfiles.map((author) => ({
      id: author.id,
      label: author.name,
      icon: author.avatar,
    }));

    items.push({
      id: 'add',
      label: 'Thêm',
      icon: (
        <ProfileIcon className="bg-dark-surface-container-high text-dark-on-surface-variant group-hover:text-kale-pink">
          <Plus className="h-9 w-9 md:h-11 md:w-11" />
        </ProfileIcon>
      ),
    });

    return items;
  }, [visibleAuthorProfiles]);

  const handleProfileSelect = (id: string) => {
    if (id === 'add') {
      setNewName('');
      setNewAvatar(COVER_IMAGES[mergedProfiles.length % COVER_IMAGES.length]);
      setUploadError(null);
      setIsAddModalOpen(true);
      return;
    }

    const found = mergedProfiles.find((p) => p.id === id);
    if (found) {
      if (isEditing) {
        return;
      }
      onSelectAuthor(found.name);
    }
  };

  const handleUploadNewAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    try {
      const dataUrl = await readImageFileAsDataUrl(file, 480);
      setNewAvatar(dataUrl);
    } catch {
      setUploadError('Không thể tải ảnh lên. Vui lòng thử lại.');
    }
    e.target.value = '';
  };

  const handleUploadExistingAvatar = async (
    profile: AuthorProfile,
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    try {
      const dataUrl = await readImageFileAsDataUrl(file, 480);
      onUpdateAuthorProfile({...profile, avatar: dataUrl}, profile.name);
    } catch {
      setUploadError('Không thể tải ảnh lên. Vui lòng thử lại.');
    }
    e.target.value = '';
  };

  const handleCreateAuthor = (e: FormEvent) => {
    e.preventDefault();
    const clean = newName.trim();
    if (!clean) return;
    const existing = mergedProfiles.find((p) => p.name.toLowerCase() === clean.toLowerCase());
    if (existing) {
      onUpdateAuthorProfile({...existing, avatar: newAvatar.trim() || existing.avatar}, existing.name);
    } else {
      onAddAuthorProfile({
        id: `author_${Date.now()}`,
        name: clean,
        avatar: newAvatar.trim() || COVER_IMAGES[0],
      });
    }
    setIsAddModalOpen(false);
  };

  const sideExpandAction = hasOverflow ? (
    <button
      id="toggle-authors-expand-btn"
      type="button"
      onClick={() => setIsAuthorsExpanded((prev) => !prev)}
      aria-expanded={isAuthorsExpanded}
      aria-label={isAuthorsExpanded ? 'Thu gọn danh sách tác giả' : `Xem thêm ${hiddenCount} tác giả`}
      data-cursor-label={isAuthorsExpanded ? 'Thu gọn' : 'Xem thêm'}
      className="cursor-target flex flex-col items-center gap-2 group cursor-pointer focus:outline-none"
    >
      <span className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-dark-surface-container border border-dark-outline-variant group-hover:border-kale-pink group-hover:text-kale-pink text-dark-on-surface flex items-center justify-center transition-all duration-300 group-hover:scale-105 shadow-md">
        {isAuthorsExpanded ? <ChevronUp className="w-6 h-6" /> : <MoreHorizontal className="w-6 h-6" />}
      </span>
      <span className="font-label text-[11px] sm:text-xs text-dark-on-surface-variant group-hover:text-light-surface-bright whitespace-nowrap">
        {isAuthorsExpanded ? 'Thu gọn' : `Xem thêm (+${hiddenCount})`}
      </span>
    </button>
  ) : undefined;

  return (
    <section
      id="curved-author-section"
      className="relative w-full rounded-xl bg-dark-surface border border-dark-outline-variant overflow-hidden py-gutter-lg"
    >
      <div className="px-gutter-lg flex flex-wrap items-center justify-between gap-gutter-sm mb-2">
        <span className="font-mono text-mono-sm uppercase tracking-wider text-kale-olive">
          Tác giả · Bấm vào ảnh tác giả để mở phòng trưng bày truyện
        </span>

        <div className="flex items-center gap-2">
          <button
            id="quick-add-author-btn"
            type="button"
            onClick={() => {
              setNewName('');
              setNewAvatar(COVER_IMAGES[mergedProfiles.length % COVER_IMAGES.length]);
              setUploadError(null);
              setIsAddModalOpen(true);
            }}
            data-cursor-label="Thêm tác giả"
            className="cursor-target inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-dark-outline-variant bg-dark-surface-container text-dark-on-surface font-label text-label-sm hover:border-kale-pink hover:text-kale-pink transition-colors cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
              person_add
            </span>
            <span>Thêm tác giả</span>
          </button>

          <button
            id="toggle-curved-edit-btn"
            type="button"
            onClick={() => setIsEditing((prev) => !prev)}
            data-cursor-label={isEditing ? 'Thu gọn' : 'Sửa tác giả'}
            className={`cursor-target inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-label text-label-sm transition-colors cursor-pointer whitespace-nowrap ${
              isEditing
                ? 'bg-kale-pink text-light-primary border-kale-pink'
                : 'bg-dark-surface-container text-dark-on-surface border-dark-outline-variant hover:border-kale-pink'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
              {isEditing ? 'expand_less' : 'edit'}
            </span>
            <span>{isEditing ? 'Thu gọn' : 'Chỉnh sửa tác giả'}</span>
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="mx-gutter-lg my-gutter-md p-gutter-md rounded-xl bg-dark-surface-container border border-dark-outline-variant flex flex-col gap-gutter-md">
          <div className="flex flex-wrap items-end justify-between gap-gutter-md">
            <label className="flex-1 min-w-[220px] flex flex-col gap-1">
              <span className="font-label text-label-sm text-dark-on-surface-variant">
                Tiêu đề hiển thị trên hàng tác giả
              </span>
              <input
                type="text"
                value={sectionTitle}
                onChange={(e) => onChangeSectionTitle(e.target.value)}
                placeholder="Chọn tác giả"
                className="rounded-lg border border-dark-outline-variant bg-dark-surface text-body-md text-light-surface-bright px-3 py-2 focus:border-kale-pink focus:outline-none"
              />
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onResetAuthorProfiles}
                className="px-3 py-2 rounded-lg border border-dark-outline-variant text-dark-on-surface-variant hover:text-kale-pink hover:border-kale-pink font-label text-label-sm cursor-pointer"
              >
                Khôi phục mặc định ({DEFAULT_AUTHOR_PROFILES.length})
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-2 rounded-lg bg-dark-surface border border-dark-outline-variant text-light-surface-bright hover:border-kale-pink font-label text-label-sm cursor-pointer"
              >
                Xong
              </button>
            </div>
          </div>

          {uploadError && (
            <div className="px-3 py-2 rounded-lg bg-dark-error-container text-dark-on-error-container font-body text-body-sm">
              {uploadError}
            </div>
          )}

          {mergedProfiles.length === 0 ? (
            <div className="p-4 rounded-lg bg-dark-surface border border-dark-outline-variant flex flex-wrap items-center justify-between gap-3">
              <span className="font-body text-body-sm text-dark-on-surface-variant">
                Chưa có tác giả nào trong danh sách. Bạn có thể thêm tác giả mới hoặc khôi phục danh sách mặc định.
              </span>
              <button
                type="button"
                onClick={onResetAuthorProfiles}
                className="px-3 py-1.5 rounded-full bg-kale-pink text-light-primary font-label text-label-sm cursor-pointer"
              >
                Khôi phục mặc định
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter-sm max-h-96 overflow-y-auto pr-1">
              {mergedProfiles.map((profile) => (
                <AuthorEditCard
                  key={profile.id}
                  profile={profile}
                  onUpdate={onUpdateAuthorProfile}
                  onDelete={onDeleteAuthorProfile}
                  onUploadAvatar={handleUploadExistingAvatar}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div id="curved-loop-wrapper" className="w-full">
        <div id="curved-loop-svg" className="w-full">
          <ProfileSelector
            title={sectionTitle || 'Chọn tác giả'}
            profiles={selectorProfiles}
            onProfileSelect={handleProfileSelect}
            sideAction={sideExpandAction}
            className="min-h-0 bg-transparent py-4 md:py-6"
          />
        </div>
      </div>

      {/* Add New Author Modal */}
      {isAddModalOpen && (
        <div
          id="add-author-modal"
          className="fixed inset-0 z-50 bg-light-on-surface/65 flex items-center justify-center p-gutter-md overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-author-modal-title"
          onClick={() => setIsAddModalOpen(false)}
        >
          <form
            onSubmit={handleCreateAuthor}
            onClick={(e) => e.stopPropagation()}
            className="bg-light-surface-bright text-light-on-surface rounded-xl max-w-md w-full p-gutter-lg border border-light-outline-variant shadow-2xl flex flex-col gap-gutter-md my-auto"
          >
            <div className="flex items-center justify-between">
              <h3 id="add-author-modal-title" className="font-headline text-headline-md text-light-on-surface">
                Thêm tác giả mới
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Đóng"
                className="w-9 h-9 rounded-full bg-light-surface-container flex items-center justify-center text-light-on-surface hover:bg-light-surface-container-high cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-kale-pink bg-dark-surface shadow-md">
                <img
                  src={newAvatar}
                  alt={newName || 'Ảnh tác giả mới'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <label className="flex flex-col gap-1">
              <span className="font-label text-label-sm text-light-on-surface">Tên tác giả</span>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ví dụ: Nam Cao"
                className="rounded-lg border border-light-outline-variant bg-light-surface text-body-md text-light-on-surface px-3 py-2 focus:border-light-primary focus:outline-none"
              />
            </label>

            <div className="flex flex-col gap-1.5">
              <span className="font-label text-label-sm text-light-on-surface">
                Ảnh tác giả (Dán URL hoặc tải ảnh từ máy)
              </span>
              <div className="flex items-center gap-gutter-sm">
                <input
                  type="url"
                  value={newAvatar}
                  onChange={(e) => setNewAvatar(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 rounded-lg border border-light-outline-variant bg-light-surface text-body-sm text-light-on-surface px-3 py-2 focus:border-light-primary focus:outline-none"
                />
                <label className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-light-surface-container text-light-on-surface font-label text-label-sm hover:bg-light-secondary-container transition-colors cursor-pointer whitespace-nowrap">
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                    upload
                  </span>
                  <span>Tải ảnh</span>
                  <input type="file" accept="image/*" onChange={handleUploadNewAvatar} className="hidden" />
                </label>
              </div>

              <div className="grid grid-cols-6 gap-2 pt-1">
                {COVER_IMAGES.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNewAvatar(url)}
                    aria-label={`Chọn ảnh mẫu ${idx + 1}`}
                    className={`aspect-square rounded-full overflow-hidden border-2 transition-transform cursor-pointer ${
                      newAvatar === url ? 'border-light-primary scale-105' : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Mẫu ${idx + 1}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {uploadError && (
              <p className="font-body text-body-sm text-light-error">{uploadError}</p>
            )}

            <div className="flex items-center justify-end gap-gutter-sm pt-gutter-xs">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-gutter-md py-2 rounded-full border border-light-outline-variant text-light-on-surface font-label text-label-sm hover:bg-light-surface-container cursor-pointer"
              >
                Huỷ
              </button>
              <button
                type="submit"
                className="px-gutter-lg py-2 rounded-full bg-light-primary text-light-on-primary font-label text-label-sm hover:bg-forest-hero cursor-pointer"
              >
                Thêm tác giả
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
