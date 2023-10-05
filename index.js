const express = require('express');
const axios = require('axios');
const _ = require('lodash');
const app = express();

const fetchBlogData = async () => {
  try {
    const curlOptions = {
      method: 'GET',
      url: 'https://intent-kit-16.hasura.app/api/rest/blogs',
      headers: {
        'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6',
      },
    };
    const response = await axios(curlOptions);
    return response.data;
  } catch (error) {
    throw new Error('Error in fetching');
  }
};

const calculateBlogStats = async (req, res, next) => {
  try {
    const blogData = await fetchBlogData();

    const numberArticles = blogData.blogs.length;
    const LongestTitleBlog = _.maxBy(blogData.blogs, 'title');
    const numWithPrivacy = _.filter(blogData.blogs, blog => _.includes(_.toLower(blog.title), 'privacy'));
    const uniqueTitles = _.uniqBy(blogData.blogs, 'title');

    res.locals.blogStats = {
      "Total number of blogs": numberArticles,
      "Title of the longest blog": LongestTitleBlog.title,
      "Number of blogs with 'privacy' in the title": numWithPrivacy.length,
      "Unique blog titles": uniqueTitles.map(blog => blog.title),
    };
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error in calculating blog statistics' });
  }
};

app.set('json spaces', 2);

app.get('/api/blog-stats', calculateBlogStats, (req, res) => {
  res.json(res.locals.blogStats);
});

app.get('/api/blog-search', async (req, res) => {
  const query = req.query.query;

  if (!query) {
    return res.status(400).json({ error: 'Provide query parameter' });
  }

  try {
    const blogData = await fetchBlogData();
    const queryBlogs = blogData.blogs.filter(blog => {
      return blog.title.toLowerCase().includes(query.toLowerCase());
    });

    res.json({ results: queryBlogs });
  } catch (error) {
    res.status(500).json({ error: 'Error in performing blog search' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
