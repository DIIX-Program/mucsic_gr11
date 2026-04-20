import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const api = async (path: string, opts?: RequestInit) => {
  const res = await fetch(`/api/admin${path}`, opts);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Admin API error');
  return json.data;
};

export const useAdmin = () => {
  const queryClient = useQueryClient();

  const usePendingTracks  = (page = 1) => useQuery({
    queryKey: ['admin', 'tracks', 'pending', page],
    queryFn:  () => api(`/tracks/pending?page=${page}`)
  });

  const useRecentComments = (page = 1) => useQuery({
    queryKey: ['admin', 'comments', 'recent', page],
    queryFn:  () => api(`/comments/recent?page=${page}`)
  });

  const useUsers = (page = 1, search = '') => useQuery({
    queryKey: ['admin', 'users', page, search],
    queryFn:  () => api(`/users?page=${page}&search=${encodeURIComponent(search)}`)
  });

  const useStats = () => useQuery({
    queryKey: ['admin', 'stats'],
    queryFn:  () => api('/stats'),
    staleTime: 30_000
  });

  const useModerateTrack = () => useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      api(`/tracks/${id}/${action}`, { method: 'PATCH' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'tracks'] })
  });

  const useModerateComment = () => useMutation({
    mutationFn: ({ id, action, status }: { id: string; action: 'status' | 'delete'; status?: 'APPROVED' | 'HIDDEN' | 'REJECTED' }) => {
      if (action === 'delete') return api(`/comments/${id}`, { method: 'DELETE' });
      return api(`/comments/${id}/status`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] })
  });

  const useManageUser = () => useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'disable' | 'enable' | 'delete' }) =>
      api(`/users/${id}/${action}`, { method: action === 'delete' ? 'DELETE' : 'PATCH' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
  });

  const useArtistRequests = () => useQuery({
    queryKey: ['admin', 'artists', 'requests'],
    queryFn: () => api('/artists/requests')
  });

  const useModerateArtist = () => useMutation({
    mutationFn: ({ id, action, verified }: { id: string; action: 'approve' | 'reject' | 'demote'; verified?: boolean }) =>
      api(`/artists/${id}/${action}`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified })
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'artists'] })
  });

  return {
    usePendingTracks, useRecentComments, useUsers, useStats,
    useModerateTrack, useModerateComment, useManageUser,
    useArtistRequests, useModerateArtist
  };
};
