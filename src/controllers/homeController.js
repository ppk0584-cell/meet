exports.index = (req, res) => {
    res.render('index', {
        title: '프레시미트 - 메뉴 고민을 덜어주는 정육점',
        message: '오늘 메뉴부터 캠핑장 직송까지 한 번에 준비합니다.'
    });
};
