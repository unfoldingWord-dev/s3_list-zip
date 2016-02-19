/**
 * This JQuery Extensions provides the ability to zip up all assets in a s3 library.
 * When a visitor clicks the given element, it will trigger the packaging process.  This
 * library will retrieve a listing from you s3 account, and will package up any files in that
 * directory.  This library requires the following Javascript libraries:
 * - JSZip (https://stuk.github.io/jszip/)
 * - JSZipUtils (https://github.com/Stuk/jszip-utils)
 */
(function ($) {
  /**
   * The settings for the plugin
   */
  var settings = {};

  $.fn.packageFiles = function(options) {

    settings = $.extend($.fn.packageFiles.defaults, options);

    /**
     * Return each object
     */
    return this.each(function() {

      $(this).click(function(event) {
        $.fn.packageFiles.package();
        return false;
      });

    });
  };
  /**
   * Package up the files and deliver it to the user
   *
   * @return {[type]} [description]
   * @access public
   */
  $.fn.packageFiles.package = function() {
    settings.onPackagingStart();
    var self = this;
    var progress = 0;
    settings.onProgressChange(0);
    $.fn.packageFiles.retrieveFiles().then(function(files) {
      if (files.length > 0) {
        var zip = new JSZip();
        /**
         * Progress is each file, and the work already completed for getting files
         */
        var increment = Math.round(100/(files.length+1));
        progress = progress+increment;
        settings.onProgressChange(progress);
        /**
         * Zip up all the files
         */
        $.when.apply($, $.map(files, function(file) {
          var filename = file.substring(file.lastIndexOf('/')+1);
          var promise = $.fn.packageFiles.fileToBlob(file);
          promise.then(
            function(blob) {
              zip.file(filename, blob, {binary: true});
              progress = progress+increment;
              settings.onProgressChange(progress);
            }, function() {
              throw new Error('Unable to retrieve the blob for ' + file + '.');
            }
          );

          return promise;
        })).done(function() {
          var content = zip.generate({type: 'blob'});
          saveAs(content, 'files.zip');
          settings.onProgressChange(100);
          settings.onPackagingComplete();
        });
      } else {
        settings.onProgressChange(100);
        settings.onPackagingComplete();
      }
    });
  };
  /**
   * Retrieve the files from the given location
   *
   * @return {Array} An array of the remote files
   * @access public
   */
  $.fn.packageFiles.retrieveFiles = function() {
    var deferred = $.Deferred();
    var s3Url = settings.bucketUrl + '?delimiter=/&prefix=' + settings.assetPath + '/';
    if (settings.usingS3ListingLibrary) {
      s3Url = createS3ListingURL();
    }
    $.get(s3Url)
      .done(function(data) {
        var xml = $(data);
        var files = $.map(xml.find('Contents'), function(item) {
          var path = $(item).find('Key').text();
          if (isFile(path)) {
            return settings.bucketUrl + '/' + path;
          }
        });
        deferred.resolve(files);
      }).fail(function(error) {
        console.error(error);
        deferred.reject(null);
      });
    return deferred.promise();
  };
  /**
   * Retrieve the file as a blob
   *
   * @param  {String} file  Path to the file
   * @return {Blob}         The file as a blob
   * @access public
   */
  $.fn.packageFiles.fileToBlob = function(filePath) {
    var deferred = $.Deferred();
    JSZipUtils.getBinaryContent(filePath, function(err, data) {
      if(err) {
        deferred.reject(null);
      } else {
        deferred.resolve(data);
      }
    });
    return deferred.promise();
  };
  /**
   * Private Methods
   */
  /**
   * Check if the path is a file or directory?
   *
   * @param  {String}  pathname The path to check
   * @return {Boolean}          Is it a file?
   * @access private
   */
  function isFile(pathname) {
    return pathname.split('/').pop().split('.').length > 1;
  }
  /**
   * Create the s3 URL based on the s3 Bucket Listing Library at https://github.com/rgrp/s3-bucket-listing
   *
   * @return {String} The new s3 URL
   * @access public
   */
  function createS3ListingURL() {
    var s3_rest_url = settings.bucketUrl;
    s3_rest_url += '?delimiter=/';
    var rx = '.*[?&]prefix=' + settings.assetPath + '([^&]+)(&.*)?$';
    var prefix = '';
    if (settings.s3ListingLibraryIgnorePath === false) {
      var prefix = location.pathname.replace(/^\//, settings.assetPath);
    }
    var match = location.search.match(rx);
    if (match) {
      prefix = settings.assetPath + match[1];
    } else {
      if (settings.s3ListingLibraryIgnorePath) {
        var prefix = settings.assetPath;
      }
    }
    if (prefix) {
      // make sure we end in /
      var prefix = prefix.replace(/\/$/, '') + '/';
      s3_rest_url += '&prefix=' + prefix;
    }
    return s3_rest_url;
  }
  /**
   * The defaults for the plugin
   *
   * bucketUrl              - This variable tells the script where your bucket XML listing is, and where the files are.
   * 													If the variable is left empty, the script will use the same hostname as the index.html.
   * 								    			(default '')
   * 								      		* Do NOT put a trailing '/', e.g. https://BUCKET.s3-REGION.amazonaws.com/
   * 								       		* Do NOT put S3 website URL, e.g. https://BUCKET.s3-website-REGION.amazonaws.com
   * assetPath              - The path to the assets in the s3 bucket
   * onProgressChange       - Callback when progress is made on the zipping. Provides a progress integer for the percent complete.
   * onPackagingStart       - Callback when the packaging has been started.
   * onPackagingComplete    - Callback when the packaging has been completed.
   * packageName            - The name of the final package
   *
   * These settings are specifically used with the S3 Bucket Listing Library at https://github.com/rgrp/s3-bucket-listing
   *
   * S3ListingLibraryIgnorePath   - If you are using the s3 bucket listing library, are you ignoring the path?
   * usingS3ListingLibrary        - Are you using the s3 bucket listing library
   *
   * @type {Object}
   */
  $.fn.packageFiles.defaults = {
    bucketUrl: '',
    assetPath: '',
    onProgressChange: function() {},
    onPackagingStart: function() {},
    onPackagingComplete: function() {},
    packageName: 'files.zip',
    s3ListingLibraryIgnorePath: false,
    usingS3ListingLibrary: false
  };

}(jQuery));
