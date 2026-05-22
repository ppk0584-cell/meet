exports.index = (req, res) => {
    res.render('index', { 
        title: '프레시미트 - 맛과 신선함의 정석',
        message: '최고급 품질의 정육을 만나보세요.'
    });
};
