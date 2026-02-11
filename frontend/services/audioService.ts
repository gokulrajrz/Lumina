import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
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
            const fileExt = uri.split('.').pop();
            const fileName = `${userId}/${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Read file as base64
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });

            // Convert base64 to ArrayBuffer
            const arrayBuffer = decode(base64);

            // Upload to Supabase
            const { data, error } = await supabase.storage
                .from('journal-audio')
                .upload(filePath, arrayBuffer, {
                    contentType: 'audio/m4a',
                    upsert: false,
                });

            if (error) {
                throw error;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('journal-audio')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Audio upload failed:', error);
            throw error;
        }
    },
};
