with (scope('Facebook','App')) {
  // add FB JS library
  initializer(function() {
    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = "//connect.facebook.net/en_US/all.js#xfbml=0&appId=280280945425178";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  });

  // parse any facebook elements that have been inserted into the DOM
  define('process_elements', function() {
    if (window.FB) {
      window.FB.XFBML.parse();
    } else {
      var previous_async = window.fbAsyncInit;
      window.fbAsyncInit = function() {
        if (previous_async) previous_async.call();
        window.FB.XFBML.parse();
      };
    }
  });

  /*
  * Attributes:
  *
  * data-href - the URL to like. The XFBML version defaults to the current page.
  * data-send - specifies whether to include a Send button with the Like button. This only works with the XFBML version.
  * data-layout - there are three options.
  *   standard - displays social text to the right of the button and friends' profile photos below. Minimum
  *     width: 225 pixels. Minimum increases by 40px if action is 'recommend' by and increases by 60px if send is 'true'.
  *     Default width: 450 pixels. Height: 35 pixels (without photos) or 80 pixels (with photos).
  *   button_count - displays the total number of likes to the right of the button. Minimum width: 90 pixels. Default
  *     width: 90 pixels. Height: 20 pixels.
  *   box_count - displays the total number of likes above the button. Minimum width: 55 pixels. Default width:
  *     55 pixels. Height: 65 pixels.
  * data-show_faces - specifies whether to display profile photos below the button (standard layout only)
  * data-width - the width of the Like button.
  * data-action - the verb to display on the button. Options: 'like', 'recommend'
  * data-font - the font to display in the button. Options: 'arial', 'lucida grande', 'segoe ui', 'tahoma', 'trebuchet ms',
  *   'verdana'
  * data-colorscheme - the color scheme for the like button. Options: 'light', 'dark'
  * data-ref - a label for tracking referrals; must be less than 50 characters and can contain alphanumeric characters and
  *   some punctuation (currently +/=-.:_). The ref attribute causes two parameters to be added to the referrer URL
  *   when a user clicks a link from a stream story about a Like action:
  *
  *   fb_ref - the ref parameter
  *   fb_source - the stream type ('home', 'profile', 'search', 'ticker', 'tickerdialog' or 'other') in which the
  *     click occurred and the story type ('oneline' or 'multiline'), concatenated with an underscore.
  * */
  define('like_button', function(options) {
    options = options || {};
    options['class']            = 'fb-like';
    options['data-send']        = false;
    options['data-href']        = options['data-href']        || window.location.href;
    options['data-width']       = options['data-width']       || 500;
    options['data-show-faces']  = options['data-show-faces']  || true;
    return div(options);
  });







  /*
   * ********************************************************
   *
   * These are deprecated. Use share_button and follow_button with their appropriate data attributes.
   * TODO: go update/remove all usages of this.
   *
   * ********************************************************
   * */
  define('share_dialog_url', function(options) {
    var options = options || {};
    return "https://www.facebook.com/dialog/feed?"
      + "app_id="           + 280280945425178
      + "&display="         + "popup"
      + "&link="            + options.link||''
      + "&redirect_uri="    + encode_html(BountySource.api_host+"kill_window_js")
      + "&name="            + options.title||''
      + "&caption="         + "BountySource is a funding platform for open-source bugs and features."
      + "&description="     + options.description||'';
  });

  define('share_dialog_button', function(dialog_url, button_text) {
    return a({ 'class': 'btn-auth btn-facebook', href: function() { window.open(dialog_url,'','width=680,height=350') } }, button_text || 'Share');
  });
};