import React, { useRef, MouseEvent, useState } from 'react';
import { PhotoWithMarks, UniqueMark } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import { Modal } from './Modal';

interface ImageTaggerProps {
  photo: PhotoWithMarks;
  onAddMark: (photoId: string, mark: UniqueMark) => void;
}

export const ImageTagger: React.FC<ImageTaggerProps> = ({ photo, onAddMark }) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const { t } = useTranslations();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [pendingMarkCoords, setPendingMarkCoords] = useState<{ x: number, y: number } | null>(null);

  const handleImageClick = (e: MouseEvent<HTMLImageElement>) => {
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100; // Percentage based
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setPendingMarkCoords({ x, y });
      setIsModalOpen(true);
    }
  };

  const handleSaveMark = (e: React.FormEvent) => {
    e.preventDefault();
    if (description && pendingMarkCoords) {
      onAddMark(photo.id, { ...pendingMarkCoords, description });
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setDescription('');
    setPendingMarkCoords(null);
  };

  return (
    <>
      <div className="relative cursor-pointer group">
        <p className="text-center text-sm font-medium text-muted-foreground mb-1">{photo.description}</p>
        <img
          ref={imageRef}
          src={photo.url}
          alt={photo.description}
          onClick={handleImageClick}
          className="w-full h-auto object-cover rounded-lg shadow-md"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
          <p className="text-white text-center p-2 text-sm font-semibold">{t('addMarkCta')}</p>
        </div>
        {photo.marks.map((mark, index) => (
          <div
            key={index}
            className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full bg-yellow-400 border-2 border-white shadow-lg"
            style={{ left: `${mark.x}%`, top: `${mark.y}%` }}
            title={mark.description}
          >
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{mark.description}</span>
          </div>
        ))}
      </div>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={t('describeMarkPrompt')}>
        <form onSubmit={handleSaveMark} className="space-y-4">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('describeMarkPlaceholder')}
            className="input-base"
            autoFocus
            required
          />
          <button type="submit" className="btn btn-primary w-full">
            {t('saveMarkButton')}
          </button>
        </form>
      </Modal>
    </>
  );
};
