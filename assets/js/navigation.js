(function($) {
  $('.nav li:first').addClass('active');

  var showSection = function showSection(section, isAnimate) {
    var direction = section.replace(/#/, '');
    var reqSection = $('.section').filter('[data-section="' + direction + '"]');
    var reqSectionPos = reqSection.offset().top - 0;

    if (isAnimate) {
      $('body, html').animate({
        scrollTop: reqSectionPos
      }, 800);
    } else {
      $('body, html').scrollTop(reqSectionPos);
    }
  };

  var checkSection = function checkSection() {
    $('.section').each(function() {
      var $this = $(this);
      var topEdge = $this.offset().top - 80;
      var bottomEdge = topEdge + $this.height();
      var wScroll = $(window).scrollTop();
      if (topEdge < wScroll && bottomEdge > wScroll) {
        var currentId = $this.data('section');
        var reqLink = $('a').filter('[href*=\\#' + currentId + ']');
        reqLink.closest('li').addClass('active').siblings().removeClass('active');
      }
    });
  };

  $('.main-menu, .scroll-to-section').on('click', 'a', function(e) {
    if ($(e.target).hasClass('external')) {
      return;
    }
    e.preventDefault();
    $('#menu').removeClass('active');
    showSection($(this).attr('href'), true);
  });

  $(window).scroll(function() {
    checkSection();
  });
})(jQuery);
