/**
 * Document is loaded
 */
$(document).ready(function() {
  $('.zip-files').packageFiles({
    bucketUrl: 'https://s3-us-west-1.amazonaws.com/test-data.missionaldigerati.org',
    assetPath: 'assets',
    onPackagingStart: startedPackaging,
    onProgressChange: progressUpdated,
    onPackagingComplete: completedPackaging
  });
});
/**
 * Call back when the packaging has started
 *
 * @return {Void}
 * @access private
 */
function startedPackaging() {
  $('#processing-modal').modal();
}
/**
 * Callback when the packaging makes some progress
 *
 * @param  {Integer} progress Percent of progress
 * @return {Void}
 * @access private
 */
function progressUpdated(progress) {
  $('#processing-progress-bar').css('width', progress+'%').text(progress+'%');
}
/**
 * Call back when the packaging has completed
 *
 * @return {Void}
 * @access private
 */
function completedPackaging() {
  $('#processing-modal').modal('hide');
}
