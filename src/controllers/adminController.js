exports.index = (req, res) => {
    res.render('admin/dashboard', { 
        title: '관리자 대시보드 요약',
        layout: 'admin/layout' // Note: This requires express-ejs-layouts or manual handling
    });
};
