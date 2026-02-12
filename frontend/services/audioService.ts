import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';

export const audioService = {
    /**
     * Upload an audio file to Supabase Storage.
     * @param uri Local file URI of the recording
     * @param userId User ID for folder organization
     * @returns Public URL of the uploaded file
     */
    async uploadAudio(uri: string, userId: string): Promise<string> {
        try {
            const fileExt = uri.split('.').pop()?.toLowerCase() || 'm4a';
            const fileName = `${userId}/${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Determine MIME type
            let mimeType = 'audio/mp4'; // Default (m4a is audio/mp4 container)
            if (fileExt === '3gp') mimeType = 'audio/3gpp';
            else if (fileExt === 'mp3') mimeType = 'audio/mpeg';
            else if (fileExt === 'wav') mimeType = 'audio/wav';
            else if (fileExt === 'aac') mimeType = 'audio/aac';

            // Get session for auth
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No session');

            // Construct Supabase Storage URL
            const uploadUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/journal-audio/${filePath}`;

            if (__DEV__) console.log(`Uploading ${mimeType} to: ${uploadUrl}`);

            // Upload directly from filesystem (native upload)
            const response = await FileSystem.uploadAsync(uploadUrl, uri, {
                httpMethod: 'POST',
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    'Content-Type': mimeType,
                },
                uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
            });

            if (response.status !== 200) {
                if (__DEV__) console.error('Upload failed body:', response.body);
                throw new Error(`Upload failed with status ${response.status}: ${response.body}`);
            }

            // Cleanup local file after successful upload
            try {
                await FileSystem.deleteAsync(uri, { idempotent: true });
                if (__DEV__) console.log('Local recording deleted:', uri);
            } catch (cleanupErr) {
                if (__DEV__) console.warn('Failed to delete local recording:', cleanupErr);
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('journal-audio')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            if (__DEV__) console.error('Audio upload failed:', error);
            throw error;
        }
    },
};
