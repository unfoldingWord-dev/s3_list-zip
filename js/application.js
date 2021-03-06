/**
 * Document is loaded
 */
$(document).ready(function() {
  $('.zip-files').packageFiles({
    bucketUrl: BUCKET_URL,
    assetPath: S3B_ROOT_DIR,
    onPackagingStart: startedPackaging,
    onProgressChange: progressUpdated,
    onPackagingComplete: completedPackaging,
    usingS3ListingLibrary: true,
    s3ListingLibraryIgnorePath: S3BL_IGNORE_PATH
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
