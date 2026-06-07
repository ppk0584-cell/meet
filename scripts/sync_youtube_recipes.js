require('dotenv').config();

const MeatRecipe = require('../src/models/MeatRecipe');

const API_BASE = 'https://www.googleapis.com/youtube/v3/search';

const SEARCH_JOBS = [
    { query: '등심 스테이크 굽는법 레시피', meat_type: 'beef', sections: ['cooking_use', 'guest_table', 'grill_ai'], tags: '스테이크,등심,굽기' },
    { query: '삼겹살 맛있게 굽는법 캠핑', meat_type: 'pork', sections: ['camping', 'grill_ai'], tags: '삼겹살,캠핑,그릴' },
    { query: '소불고기 레시피 집밥', meat_type: 'beef', sections: ['family_table', 'situation'], tags: '불고기,집밥,가족식탁' },
    { query: '목살 스테이크 레시피', meat_type: 'pork', sections: ['cooking_use', 'guest_table'], tags: '목살,스테이크,손님상' },
    { query: '돼지갈비찜 레시피', meat_type: 'pork', sections: ['family_table', 'cooking_use'], tags: '돼지갈비,찜,가족식탁' },
    { query: '닭갈비 레시피', meat_type: 'chicken', sections: ['family_table', 'situation'], tags: '닭갈비,집밥,닭고기' }
];

function requireApiKey() {
    if (!process.env.YOUTUBE_API_KEY) {
        throw new Error('YOUTUBE_API_KEY 환경변수가 필요합니다. .env 또는 운영 서버 환경변수에 설정해주세요.');
    }
    return process.env.YOUTUBE_API_KEY;
}

function videoUrl(videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`;
}

function cleanTitle(title) {
    return String(title || '')
        .replace(/\[[^\]]+\]/g, '')
        .replace(/\([^)]*\)/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 120);
}

async function searchVideos(job, maxResults) {
    const params = new URLSearchParams({
        key: requireApiKey(),
        part: 'snippet',
        q: job.query,
        type: 'video',
        videoEmbeddable: 'true',
        relevanceLanguage: 'ko',
        regionCode: 'KR',
        maxResults: String(maxResults)
    });
    const response = await fetch(`${API_BASE}?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error?.message || `YouTube API 호출 실패: ${response.status}`);
    }
    return data.items || [];
}

async function importVideo(job, item) {
    const id = item.id?.videoId;
    if (!id) return false;
    const link = videoUrl(id);
    const existing = await MeatRecipe.findByVideoUrl(link);
    if (existing) return false;

    const snippet = item.snippet || {};
    const title = cleanTitle(snippet.title);
    await MeatRecipe.create({
        meat_type: job.meat_type,
        menu_name: title || job.query,
        ingredients: '유튜브 영상 설명과 관리자 검수 후 재료를 입력해주세요.',
        cooking_steps: '유튜브 영상 확인 후 조리방법을 정리해주세요.',
        video_url: link,
        image_url: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
        sections: job.sections,
        tags: job.tags,
        source_name: snippet.channelTitle || 'YouTube',
        source_url: link,
        memo: `YouTube API 후보 수집: ${job.query}`,
        is_active: 0
    });
    return true;
}

async function main() {
    const maxResults = Number(process.argv[2] || 5);
    let created = 0;
    let skipped = 0;
    for (const job of SEARCH_JOBS) {
        const items = await searchVideos(job, maxResults);
        for (const item of items) {
            const ok = await importVideo(job, item);
            if (ok) created += 1;
            else skipped += 1;
        }
    }
    console.log(JSON.stringify({ created, skipped, jobs: SEARCH_JOBS.length }, null, 2));
    process.exit(0);
}

main().catch(error => {
    console.error(error.message);
    process.exit(1);
});
