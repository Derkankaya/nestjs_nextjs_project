import api from './api';

export interface Comment {
  id: string;
  content: string;
  author: {
    name: string;
    email: string;
    avatar: string | null;
  };
  post: {
    id: string;
    title: string;
    slug: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface CommentResponse {
  comments: Comment[];
  total: number;
}

// Fetch all comments with optional pagination and status filter
export const getComments = async (
  status?: 'PENDING' | 'APPROVED' | 'REJECTED',
  limit: number = 10,
  offset: number = 0
): Promise<CommentResponse> => {
  const response = await api.get<CommentResponse>('/comments', {
    params: { status, limit, offset },
  });
  return response.data;
};

// Fetch pending comments
export const getPendingComments = async (limit: number = 10, offset: number = 0): Promise<CommentResponse> => {
  return getComments('PENDING', limit, offset);
};

// Fetch approved comments
export const getApprovedComments = async (limit: number = 10, offset: number = 0): Promise<CommentResponse> => {
  return getComments('APPROVED', limit, offset);
};

// Approve a comment
export const approveComment = async (id: string): Promise<Comment> => {
  const response = await api.patch<Comment>(`/comments/${id}/approve`);
  return response.data;
};

// Reject a comment
export const rejectComment = async (id: string): Promise<Comment> => {
  const response = await api.patch<Comment>(`/comments/${id}/reject`);
  return response.data;
};

// Delete a comment
export const deleteComment = async (id: string): Promise<void> => {
  await api.delete(`/comments/${id}`);
};
