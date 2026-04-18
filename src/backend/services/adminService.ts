import { adminRepository } from "../repositories/adminRepository.js";

export const adminService = {
  getPendingTracks: async (page = 1, limit = 10) =>
    adminRepository.getPendingTracks(limit, (page - 1) * limit),

  getRejectedTracks: async (page = 1, limit = 10) =>
    adminRepository.getRejectedTracks(limit, (page - 1) * limit),

  approveTrack: async (id: string) => adminRepository.updateTrackStatus(id, 'APPROVED'),
  rejectTrack:  async (id: string) => adminRepository.updateTrackStatus(id, 'REJECTED'),

  getRecentComments: async (page = 1, limit = 20) =>
    adminRepository.getRecentComments(limit, (page - 1) * limit),

  moderateComment: async (id: string, status: 'APPROVED' | 'HIDDEN' | 'REJECTED') =>
    adminRepository.updateCommentStatus(id, status),

  deleteComment: async (id: string) => adminRepository.deleteComment(id),

  getUsers: async (page = 1, limit = 50, search?: string) =>
    adminRepository.getUsers(limit, (page - 1) * limit, search),

  disableUser: async (id: string) => adminRepository.setUserStatus(id, 'disabled'),
  enableUser:  async (id: string) => adminRepository.setUserStatus(id, 'active'),
  deleteUser:  async (id: string) => adminRepository.deleteUser(id),

  getStats: async () => adminRepository.getStats(),
};
