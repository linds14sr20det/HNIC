+function ($) { "use strict";
    var PostForm = function () {
        this.$preview = $('#blog-post-preview')
        this.$form = this.$preview.closest('form')
        this.formAction = this.$form.attr('action')
        this.sessionKey = $('input[name=_session_key]', this.$form).val()
        this.$textarea = $('[name="Post[content]"]', this.$form)
        this.$previewContent = $('.preview-content', this.$preview)
        this.codeEditor = $('textarea[name="Post[content]"]', this.$form).closest('.field-codeeditor').data('oc.codeEditor')
        this.createIndicator()

        this.$textarea.on('oc.codeEditorChange', $.proxy(this.handleChange, this))

        this.loading = false
        this.updatesPaused = false
        this.initPreview()
        this.initDropzones()
        this.initFormEvents()
        this.initLayout()
    }

    PostForm.prototype.handleChange = function() {
        if (this.updatesPaused)
            return

        var self = this

        if (this.loading) {
            if (this.dataTrackInputTimer === undefined) {
                this.dataTrackInputTimer = window.setInterval(function(){
                    self.handleChange()
                }, 100)
            }

            return
        }

        window.clearTimeout(this.dataTrackInputTimer)
        this.dataTrackInputTimer = undefined

        var self = this;
        self.update();
    }

    PostForm.prototype.createIndicator = function() {
        var $previewContainer = $('#blog-post-preview').closest('.loading-indicator-container')
        this.$indicator = $('<div class="loading-indicator transparent"><div></div><span></span></div>')
        $previewContainer.prepend(this.$indicator)
    }

    PostForm.prototype.update = function() {
        var self = this

        this.loading = true
        this.showIndicator()

        this.$form.request('onRefreshPreview', {
            success: function(data) {
                self.$previewContent.html(data.preview)
                self.initPreview()
                self.updateScroll()
            }
        }).done(function(){
            self.hideIndicator()
            self.loading = false
        })
    }

    PostForm.prototype.showIndicator = function() {
        this.$indicator.css('display', 'block')
    }

    PostForm.prototype.hideIndicator = function() {
        this.$indicator.css('display', 'none')
    }

    PostForm.prototype.initPreview = function() {
        prettyPrint()
        this.initImageUploaders()
    }

    PostForm.prototype.updateScroll = function() {
        this.$preview.data('oc.scrollbar').update()
    }

    PostForm.prototype.initImageUploaders = function() {
        var self = this
        $('span.image-placeholder .upload-dropzone', this.$preview).each(function(){
            var
                $placeholder = $(this).parent(),
                $link = $('span.label', $placeholder),
                placeholderIndex = $placeholder.data('index')

            var dropzone = new Dropzone($(this).get(0), {
                url: self.formAction,
                clickable: [$(this).get(0), $link.get(0)],
                previewsContainer: $('<div />').get(0),
                paramName: 'file'
            })

            dropzone.on('error', function(file, error) {
                alert('Error uploading file: ' + error)
            })
            dropzone.on('success', function(file, data){
                if (data.error)
                    alert(data.error)
                else {
                    self.pauseUpdates()
                    var $img = $('<img src="'+data.path+'">')
                    $img.load(function(){
                        self.updateScroll()
                    })

                    $placeholder.replaceWith($img)

                    self.codeEditor.editor.replace('!['+data.file+']('+data.path+')', {
                        needle: '!['+placeholderIndex+'](image)'
                    })
                    self.resumeUpdates()
                }
            })
            dropzone.on('complete', function(){
                $placeholder.removeClass('loading')
            })
            dropzone.on('sending', function(file, xhr, formData) {
                formData.append('X_BLOG_IMAGE_UPLOAD', 1)
                formData.append('_session_key', self.sessionKey)
                $placeholder.addClass('loading')
            })
        })
    }

    PostForm.prototype.pauseUpdates = function() {
        this.updatesPaused = true
    }

    PostForm.prototype.resumeUpdates = function() {
        this.updatesPaused = false
    }

    PostForm.prototype.initDropzones = function() {
        $(document).bind('dragover', function (e) {
            var dropZone = $('span.image-placeholder .upload-dropzone'),
                foundDropzone,
                timeout = window.dropZoneTimeout

            if (!timeout)
                dropZone.addClass('in');
            else
                clearTimeout(timeout);

            var found = false,
                node = e.target

            do {
                if ($(node).hasClass('dropzone')) {
                    found = true
                    foundDropzone = $(node)
                    break
                }

                node = node.parentNode;

            } while (node != null);

            dropZone.removeClass('in hover')

            if (found)
                foundDropzone.addClass('hover')

            window.dropZoneTimeout = setTimeout(function () {
                window.dropZoneTimeout = null
                dropZone.removeClass('in hover')
            }, 100)
        })
    }

    PostForm.prototype.initFormEvents = function() {
        $(document).on('ajaxSuccess', '#post-form', function(event, context, data){
            if (context.handler == 'onSave' && !data.X_OCTOBER_ERROR_FIELDS) {
                $(this).trigger('unchange.oc.changeMonitor');
                var answer = confirm ("Do you want to post this to Twitter and Facebook? Cancel will still save this page.")
                if (answer){
                    FB.getLoginStatus(function(response) {
                        FB.login(function(response){
                        console.log(response);    
                        var uid = response.authResponse.userID;
                        var accessToken = response.authResponse.accessToken;
                        postToApi(accessToken, uid);
                        }, {scope: 'publish_actions, user_groups, manage_pages'});
                    });
                }
            }
        })

        $('#DatePicker-formPublishedAt-input-published_at').triggerOn({
            triggerCondition: 'checked',
            trigger: '#Form-field-Post-published',
            triggerType: 'enable'
        })
    }

    PostForm.prototype.initLayout = function() {
        $('#Form-secondaryTabs .tab-pane.layout-cell:not(:first-child)').addClass('padded-pane')
    }

    PostForm.prototype.replacePlaceholder = function(placeholder, placeholderHtmlReplacement, mdCodePlaceholder, mdCodeReplacement) {
        this.pauseUpdates()
        placeholder.replaceWith(placeholderHtmlReplacement)

        this.codeEditor.editor.replace(mdCodeReplacement, {
            needle: mdCodePlaceholder
        })
        this.updateScroll()
        this.resumeUpdates()
    }
    
    $(document).ready(function(){
        var form = new PostForm()

        if ($.oc === undefined)
            $.oc = {}

        $.oc.blogPostForm = form
    })

    function postToApi(accessToken, uid){
        var _message = $("#Form-field-Post-excerpt").val();
        var _link = "http://www.hobbynight.ca/blog/post/" + $("#Form-field-Post-slug").val();
        var _name = $("#Form-field-Post-title").val();
        var _description = $(".preview-content").find("p:first").text().substring(0, 100);

        var urlString = '/backend/rainlab/blog/autopost';
        var twitterMessage = _message.substring(0,50);
        $.ajax({
            method: 'get',
            url: urlString,
            data: { status: twitterMessage.concat(" ", _link) },
            error: function(e){
                console.log("There has been an error with the post to Twitter");
                console.log(e);
            }
        });  

        FB.api("/"+uid+"/accounts", "get", {access_token : accessToken}, function (response) {
            for(var i = 0; i < response.data.length; i++){
                if (response.data[i].name == "Hobby Night in Canada Podcast"){
                    accessToken = response.data[i].access_token;
                    FB.api("/me/feed", "post", 
                        {
                            access_token : accessToken, 
                            message: _message, 
                            link: _link,
                            name: _name,
                            description: _description
                        }, 
                        function (response) {
                            console.log(response);
                            if (!response || response.error) {
                                alert("Something has gone wrong with the auto-post:\n" +
                                response.error.error_user_msg);
                                console.log(response);
                            }
                        });
                }
            }
        });
    }

}(window.jQuery);
