this.$slideOut_config = $('#slideOut_config');
this.$slideOut_saved_config = $('#slideOut_saved_config');
this.$slideOut_result = $('#slideOut_result');

// Slideout show
this.$slideOut_config.find('.slideOutTab_left').on('click', function() {
  $("#slideOut_config").toggleClass('showSlideOut_left');
});

// Slideout show
this.$slideOut_saved_config.find('.slideOutTab_right').on('click', function() {
  $("#slideOut_saved_config").toggleClass('showSlideOut_right');
});

// Slideout show
this.$slideOut_result.find('.slideOutTab_right').on('click', function() {
  $("#slideOut_result").toggleClass('showSlideOut_right');
});