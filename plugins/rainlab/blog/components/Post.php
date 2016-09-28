<?php namespace RainLab\Blog\Components;

use Cms\Classes\Page;
use Cms\Classes\ComponentBase;
use RainLab\Blog\Models\Post as BlogPost;

class Post extends ComponentBase
{
    /**
     * @var RainLab\Blog\Models\Post The post model used for display.
     */
    public $post;

    /**
     * @var string Reference to the page name for linking to categories.
     */
    public $categoryPage;

    public function componentDetails()
    {
        return [
            'name'        => 'rainlab.blog::lang.settings.post_title',
            'description' => 'rainlab.blog::lang.settings.post_description'
        ];
    }

    public function defineProperties()
    {
        return [
            'slug' => [
                'title'       => 'rainlab.blog::lang.settings.post_slug',
                'description' => 'rainlab.blog::lang.settings.post_slug_description',
                'default'     => '{{ :slug }}',
                'type'        => 'string'
            ],
            'categoryPage' => [
                'title'       => 'rainlab.blog::lang.settings.post_category',
                'description' => 'rainlab.blog::lang.settings.post_category_description',
                'type'        => 'dropdown',
                'default'     => 'blog/category',
            ],
        ];
    }

    public function getCategoryPageOptions()
    {
        return Page::sortBy('baseFileName')->lists('baseFileName', 'baseFileName');
    }

    public function onRun()
    {
        $this->categoryPage = $this->page['categoryPage'] = $this->property('categoryPage');
        $this->post = $this->page['post'] = $this->loadPost();
        $this->post['next'] = $this->page['next'] = $this->getNextPost();
        $this->post['prev'] = $this->page['prev'] = $this->getPrevPost();    
    }

    protected function getNextPost() {
        $id = $this->post->id;
        $post = BlogPost::isPublished()->where('id', '>' , $id)->first();
        if (!isset($post['slug']) || trim($post['slug'])==='') {
            return false;
        }
        return $post['slug'];
    }

    protected function getPrevPost() {
        $id = $this->post->id;
        $post = BlogPost::isPublished()->orderBy('id', 'desc')->where('id', '<', $id)->first();
        if (!isset($post['slug']) || trim($post['slug'])==='') {
            return false;
        }
        return $post['slug'];
    }

    protected function loadPost()
    {
        $slug = $this->property('slug');
        $post = BlogPost::isPublished()->where('slug', $slug)->first();

        /*
         * Add a "url" helper attribute for linking to each category
         */
        if ($post && $post->categories->count()) {
            $post->categories->each(function($category){
                $category->setUrl($this->categoryPage, $this->controller);
            });
        }

        return $post;
    }
}
