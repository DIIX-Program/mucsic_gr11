import React from 'react';
import { Check, X, Play, MessageSquare } from 'lucide-react';

interface ModerationCardProps {
  type: 'track' | 'comment';
  data: any;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isMutating?: boolean;
}

/**
 * Moderation Card
 * Displays item details and provides moderation actions.
 */
const ModerationCard: React.FC<ModerationCardProps> = ({ 
  type, 
  data, 
  onApprove, 
  onReject,
  isMutating 
}) => {
  return (
    <div className={`
      relative group overflow-hidden bg-white dark:bg-zinc-900 
      border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4
      transition-all duration-300 hover:shadow-xl hover:-translate-y-1
      ${isMutating ? 'opacity-50 pointer-events-none' : ''}
    `}>
      <div className="flex items-start gap-4">
        {/* Thumbnail/Icon */}
        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
          {type === 'track' ? (
            <>
              <img 
                src={data.cover_path || 'https://via.placeholder.com/150'} 
                alt={data.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play className="w-6 h-6 text-white" />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-zinc-400" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {type === 'track' ? data.title : `Comment on "${data.track_title}"`}
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              Pending
            </span>
          </div>
          
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
            {type === 'track' ? `by ${data.main_artist}` : data.content}
          </p>

          <div className="mt-1 text-xs text-zinc-400">
            {type === 'track' ? `Uploaded by ${data.uploader_name}` : `By ${data.username}`}
            {' • '}
            {new Date(data.created_at).toLocaleDateString()}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 ml-2">
          <button
            onClick={() => onApprove(data.id)}
            className="p-2 rounded-xl bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white transition-all shadow-sm"
            title="Approve"
          >
            <Check className="w-5 h-5" />
          </button>
          <button
            onClick={() => onReject(data.id)}
            className="p-2 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-all shadow-sm"
            title="Reject"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModerationCard;
