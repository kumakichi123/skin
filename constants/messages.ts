export const isJa = typeof navigator !== 'undefined' && navigator.language?.startsWith('ja')


export const MESSAGES = {
selectImage: isJa ? '画像を選択してください' : 'Please select an image',
analyzeFail: isJa ? '解析に失敗しました' : 'Analysis failed',
recommendFail: isJa ? 'レコメンド取得に失敗しました' : 'Failed to fetch recommendations',
faceNotFound: isJa
? '顔が検出できませんでした。明るい場所で正面から撮影してください。'
: 'No face detected. Please take a clear front-facing photo in good lighting.',
networkError: isJa ? '通信エラーが発生しました' : 'A network error occurred',
}


export const SHARE_ENDPOINT: '/api/share' | '/api/og' = '/api/share'