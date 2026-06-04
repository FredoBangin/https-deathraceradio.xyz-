import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface UploadState {
  isOpen: boolean;
  uploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
  selectedSongId: number | null; // Pre-select song in upload form if opened from song detail
}

const initialState: UploadState = {
  isOpen: false,
  uploading: false,
  progress: 0,
  error: null,
  success: false,
  selectedSongId: null,
};

export const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    openUploadModal: (state, action: PayloadAction<number | null>) => {
      state.isOpen = true;
      state.selectedSongId = action.payload;
      state.success = false;
      state.error = null;
      state.progress = 0;
    },
    closeUploadModal: (state) => {
      state.isOpen = false;
      state.selectedSongId = null;
    },
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.progress = action.payload;
    },
    startUploading: (state) => {
      state.uploading = true;
      state.progress = 0;
      state.error = null;
      state.success = false;
    },
    uploadSuccess: (state) => {
      state.uploading = false;
      state.success = true;
      state.progress = 100;
    },
    uploadFailure: (state, action: PayloadAction<string>) => {
      state.uploading = false;
      state.error = action.payload;
      state.success = false;
    },
    resetUploadState: (state) => {
      state.uploading = false;
      state.progress = 0;
      state.error = null;
      state.success = false;
    }
  },
});

export const {
  openUploadModal,
  closeUploadModal,
  setUploadProgress,
  startUploading,
  uploadSuccess,
  uploadFailure,
  resetUploadState
} = uploadSlice.actions;

export default uploadSlice.reducer;
