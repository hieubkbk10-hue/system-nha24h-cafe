import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { contentStatus } from "./lib/validators";
import { rankByFuzzyMatches } from "./lib/search";
import * as PostsModel from "./model/posts";
import type { Doc } from "./_generated/dataModel";

const postDoc = v.object({
  _creationTime: v.number(),
  _id: v.id("posts"),
  authorId: v.optional(v.id("users")),
  authorName: v.optional(v.string()),
  categoryId: v.id("postCategories"),
  content: v.string(),
  renderType: v.optional(v.union(
    v.literal("content"),
    v.literal("markdown"),
    v.literal("html")
  )),
  markdownRender: v.optional(v.string()),
  htmlRender: v.optional(v.string()),
  excerpt: v.optional(v.string()),
  metaDescription: v.optional(v.string()),
  metaTitle: v.optional(v.string()),
  order: v.number(),
  publishedAt: v.optional(v.number()),
  slug: v.string(),
  status: contentStatus,
  thumbnail: v.optional(v.string()),
  title: v.string(),
  views: v.number(),
});

// Pagination result validator - includes new Convex pagination fields
const paginatedPosts = v.object({
  continueCursor: v.string(),
  isDone: v.boolean(),
  page: v.array(postDoc),
  pageStatus: v.optional(v.union(v.literal("SplitRecommended"), v.literal("SplitRequired"), v.null())),
  splitCursor: v.optional(v.union(v.string(), v.null())),
});

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => ctx.db.query("posts").paginate(args.paginationOpts),
  returns: paginatedPosts,
});

// Limited list for admin (max 100 items - use pagination for more)
export const listAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => PostsModel.listWithLimit(ctx, { limit: args.limit }),
  returns: v.array(postDoc),
});

export const listAdminWithOffset = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    search: v.optional(v.string()),
    status: v.optional(contentStatus),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 10, 100);
    const offset = args.offset ?? 0;
    const fetchLimit = Math.min(offset + limit + 20, 500);
    let posts: Doc<"posts">[] = [];

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("posts")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower);
          return args.status ? builder.eq("status", args.status) : builder;
        });
      posts = await searchQuery.take(fetchLimit);
    } else if (args.status) {
      posts = await ctx.db
        .query("posts")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(fetchLimit);
    } else {
      posts = await ctx.db
        .query("posts")
        .order("desc")
        .take(fetchLimit);
    }

    if (args.search?.trim() && posts.length > 0) {
      const searchLower = args.search.toLowerCase().trim();
      posts = posts.filter((post) => post.title.toLowerCase().includes(searchLower));
    }

    return posts.slice(offset, offset + limit);
  },
  returns: v.array(postDoc),
});

export const countAdmin = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(contentStatus),
  },
  handler: async (ctx, args) => {
    const limit = 5000;
    let posts: Doc<"posts">[] = [];

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("posts")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower);
          return args.status ? builder.eq("status", args.status) : builder;
        });
      posts = await searchQuery.take(limit + 1);
    } else if (args.status) {
      posts = await ctx.db
        .query("posts")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", args.status!))
        .take(limit + 1);
    } else {
      posts = await ctx.db
        .query("posts")
        .take(limit + 1);
    }

    return { count: Math.min(posts.length, limit), hasMore: posts.length > limit };
  },
  returns: v.object({ count: v.number(), hasMore: v.boolean() }),
});

export const listAdminIds = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(contentStatus),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5000, 5000);
    let posts: Doc<"posts">[] = [];

    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("posts")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower);
          return args.status ? builder.eq("status", args.status) : builder;
        });
      posts = await searchQuery.take(limit + 1);
    } else if (args.status) {
      posts = await ctx.db
        .query("posts")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", args.status!))
        .take(limit + 1);
    } else {
      posts = await ctx.db
        .query("posts")
        .take(limit + 1);
    }

    const hasMore = posts.length > limit;
    return { ids: posts.slice(0, limit).map((post) => post._id), hasMore };
  },
  returns: v.object({ ids: v.array(v.id("posts")), hasMore: v.boolean() }),
});

// Efficient count using take() instead of collect()
export const count = query({
  args: { status: v.optional(contentStatus) },
  handler: async (ctx, args) => PostsModel.countWithLimit(ctx, { status: args.status }),
  returns: v.object({
    count: v.number(),
    hasMore: v.boolean(),
  }),
});

// Legacy count for backward compatibility (returns number)
export const countSimple = query({
  args: { status: v.optional(contentStatus) },
  handler: async (ctx, args) => {
    const result = await PostsModel.countWithLimit(ctx, { status: args.status });
    return result.count;
  },
  returns: v.number(),
});

export const getById = query({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => ctx.db.get(args.id),
  returns: v.union(postDoc, v.null()),
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique(),
  returns: v.union(postDoc, v.null()),
});

export const listByCategory = query({
  args: {
    categoryId: v.id("postCategories"),
    paginationOpts: paginationOptsValidator,
    status: v.optional(contentStatus),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return  ctx.db
        .query("posts")
        .withIndex("by_category_status", (q) =>
          q.eq("categoryId", args.categoryId).eq("status", args.status!)
        )
        .paginate(args.paginationOpts);
    }
    return  ctx.db
      .query("posts")
      .withIndex("by_category_status", (q) => q.eq("categoryId", args.categoryId))
      .paginate(args.paginationOpts);
  },
  returns: paginatedPosts,
});

export const listByAuthor = query({
  args: {
    authorName: v.string(),
    paginationOpts: paginationOptsValidator,
    status: v.optional(contentStatus),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return  ctx.db
        .query("posts")
        .withIndex("by_author_name_status", (q) =>
          q.eq("authorName", args.authorName).eq("status", args.status!)
        )
        .paginate(args.paginationOpts);
    }
    return  ctx.db
      .query("posts")
      .withIndex("by_author_name_status", (q) => q.eq("authorName", args.authorName))
      .paginate(args.paginationOpts);
  },
  returns: paginatedPosts,
});

export const listPublished = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => ctx.db
      .query("posts")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
      .order("desc")
      .paginate(args.paginationOpts),
  returns: paginatedPosts,
});

export const listMostViewed = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => ctx.db
      .query("posts")
      .withIndex("by_status_views", (q) => q.eq("status", "Published"))
      .order("desc")
      .paginate(args.paginationOpts),
  returns: paginatedPosts,
});

// Search and filter published posts
export const searchPublished = query({
  args: {
    categoryId: v.optional(v.id("postCategories")),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
    sortBy: v.optional(v.union(
      v.literal("newest"),
      v.literal("oldest"),
      v.literal("popular"),
      v.literal("title")
    )),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);
    const sortBy = args.sortBy ?? "newest";
    
    let posts: Doc<"posts">[] = [];
    
    // Filter by category if provided
    if (args.categoryId) {
      posts = await ctx.db
        .query("posts")
        .withIndex("by_category_status", (q) => 
          q.eq("categoryId", args.categoryId!).eq("status", "Published")
        )
        .take(limit * 2); // Get more for client-side filtering
    } else {
      // Get all published posts
      if (sortBy === "popular") {
        posts = await ctx.db
          .query("posts")
          .withIndex("by_status_views", (q) => q.eq("status", "Published"))
          .order("desc")
          .take(limit * 2);
      } else {
        posts = await ctx.db
          .query("posts")
          .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
          .order(sortBy === "oldest" ? "asc" : "desc")
          .take(limit * 2);
      }
    }
    
    // Client-side text search (Convex doesn't have full-text search built-in)
    if (args.search && args.search.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      posts = posts.filter(post => 
        post.title.toLowerCase().includes(searchLower) ||
        (post.excerpt?.toLowerCase().includes(searchLower))
      );
    }
    
    // Sort if needed (after category filter)
    if (args.categoryId) {
      switch (sortBy) {
        case "oldest": {
          posts.sort((a, b) => (a.publishedAt ?? 0) - (b.publishedAt ?? 0));
          break;
        }
        case "popular": {
          posts.sort((a, b) => b.views - a.views);
          break;
        }
        case "title": {
          posts.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
          break;
        }
        default: { // Newest
          posts.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
        }
      }
    } else if (sortBy === "title") {
      posts.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
    }
    
    return posts.slice(0, limit);
  },
  returns: v.array(postDoc),
});

// Get featured posts (most viewed)
export const listFeatured = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 5, 20);
    return  ctx.db
      .query("posts")
      .withIndex("by_status_views", (q) => q.eq("status", "Published"))
      .order("desc")
      .take(limit);
  },
  returns: v.array(postDoc),
});

// Count published posts (for result display)
export const countPublished = query({
  args: { categoryId: v.optional(v.id("postCategories")) },
  handler: async (ctx, args) => {
    if (args.categoryId) {
      const posts = await ctx.db
        .query("posts")
        .withIndex("by_category_status", (q) => 
          q.eq("categoryId", args.categoryId!).eq("status", "Published")
        )
        .take(1000);
      return posts.length;
    }
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
      .take(1000);
    return posts.length;
  },
  returns: v.number(),
});

// Paginated published posts for usePaginatedQuery hook (infinite scroll)
export const listPublishedPaginated = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    categoryId: v.optional(v.id("postCategories")),
    sortBy: v.optional(v.union(
      v.literal("newest"),
      v.literal("oldest"),
      v.literal("popular"),
    )),
  },
  handler: async (ctx, args) => {
    const sortBy = args.sortBy ?? "newest";
    
    if (args.categoryId) {
      return ctx.db
        .query("posts")
        .withIndex("by_category_status", (q) => 
          q.eq("categoryId", args.categoryId!).eq("status", "Published")
        )
        .order("desc")
        .paginate(args.paginationOpts);
    }
    
    if (sortBy === "popular") {
      return ctx.db
        .query("posts")
        .withIndex("by_status_views", (q) => q.eq("status", "Published"))
        .order("desc")
        .paginate(args.paginationOpts);
    }
    
    return ctx.db
      .query("posts")
      .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
      .order(sortBy === "oldest" ? "asc" : "desc")
      .paginate(args.paginationOpts);
  },
  returns: paginatedPosts,
});

// Offset-based pagination for URL-based pagination mode
export const listPublishedWithOffset = query({
  args: {
    categoryId: v.optional(v.id("postCategories")),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    search: v.optional(v.string()),
    sortBy: v.optional(v.union(
      v.literal("newest"),
      v.literal("oldest"),
      v.literal("popular"),
      v.literal("title")
    )),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 12, 50);
    const offset = args.offset ?? 0;
    const sortBy = args.sortBy ?? "newest";
    
    let posts: Doc<"posts">[] = [];
    
    // Fetch more than needed to handle offset (Convex doesn't have native offset)
    const fetchLimit = offset + limit + 10;
    
    if (args.search?.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      const searchQuery = ctx.db
        .query("posts")
        .withSearchIndex("search_title", (q) => {
          const builder = q.search("title", searchLower).eq("status", "Published");
          return args.categoryId ? builder.eq("categoryId", args.categoryId) : builder;
        });
      posts = await searchQuery.take(fetchLimit);
    } else if (args.categoryId) {
      posts = await ctx.db
        .query("posts")
        .withIndex("by_category_status", (q) => 
          q.eq("categoryId", args.categoryId!).eq("status", "Published")
        )
        .take(fetchLimit);
    } else if (sortBy === "popular") {
      posts = await ctx.db
        .query("posts")
        .withIndex("by_status_views", (q) => q.eq("status", "Published"))
        .order("desc")
        .take(fetchLimit);
    } else {
      posts = await ctx.db
        .query("posts")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
        .order(sortBy === "oldest" ? "asc" : "desc")
        .take(fetchLimit);
    }
    
    if (args.search?.trim() && posts.length > 0) {
      const ranked = rankByFuzzyMatches(
        posts,
        args.search,
        (post) => [post.title ?? "", post.excerpt ?? ""],
        42,
      );
      posts = ranked.map((entry) => entry.item);
    } else if (sortBy === "title") {
      posts.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
    } else if (args.categoryId) {
      // Re-sort if filtered by category
      switch (sortBy) {
        case "oldest":
          posts.sort((a, b) => (a.publishedAt ?? 0) - (b.publishedAt ?? 0));
          break;
        case "popular":
          posts.sort((a, b) => b.views - a.views);
          break;
        default:
          posts.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
      }
    }
    
    // Apply offset and limit
    return posts.slice(offset, offset + limit);
  },
  returns: v.array(postDoc),
});

// Search published posts with cursor-based pagination
export const searchPublishedPaginated = query({
  args: {
    categoryId: v.optional(v.id("postCategories")),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
    sortBy: v.optional(v.union(
      v.literal("newest"),
      v.literal("oldest"),
      v.literal("popular"),
      v.literal("title")
    )),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 12, 50);
    const sortBy = args.sortBy ?? "newest";
    
    // Build pagination options
    const paginationOpts = {
      numItems: limit,
      cursor: args.cursor ?? null,
    };
    
    let result;
    
    // Use appropriate index based on filters
    if (args.categoryId) {
      result = await ctx.db
        .query("posts")
        .withIndex("by_category_status", (q) => 
          q.eq("categoryId", args.categoryId!).eq("status", "Published")
        )
        .paginate(paginationOpts);
    } else if (sortBy === "popular") {
      result = await ctx.db
        .query("posts")
        .withIndex("by_status_views", (q) => q.eq("status", "Published"))
        .order("desc")
        .paginate(paginationOpts);
    } else {
      result = await ctx.db
        .query("posts")
        .withIndex("by_status_publishedAt", (q) => q.eq("status", "Published"))
        .order(sortBy === "oldest" ? "asc" : "desc")
        .paginate(paginationOpts);
    }
    
    let posts = result.page;
    
    // Client-side text search filter
    if (args.search && args.search.trim()) {
      const searchLower = args.search.toLowerCase().trim();
      posts = posts.filter(post => 
        post.title.toLowerCase().includes(searchLower) ||
        (post.excerpt?.toLowerCase().includes(searchLower))
      );
    }
    
    // Sort by title if needed (other sorts handled by index)
    if (sortBy === "title") {
      posts.sort((a, b) => a.title.localeCompare(b.title, 'vi'));
    }
    
    return {
      posts,
      nextCursor: result.isDone ? null : result.continueCursor,
      isDone: result.isDone,
    };
  },
  returns: v.object({
    posts: v.array(postDoc),
    nextCursor: v.union(v.string(), v.null()),
    isDone: v.boolean(),
  }),
});

export const create = mutation({
  args: {
    authorName: v.optional(v.string()),
    categoryId: v.id("postCategories"),
    content: v.string(),
    renderType: v.optional(v.union(
      v.literal("content"),
      v.literal("markdown"),
      v.literal("html")
    )),
    markdownRender: v.optional(v.string()),
    htmlRender: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    order: v.optional(v.number()),
    slug: v.string(),
    status: v.optional(contentStatus),
    thumbnail: v.optional(v.string()),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await PostsModel.create(ctx, args);
    await ctx.runMutation(api.landingPages.syncProgrammaticFromSourceChange, { source: "post" });
    return id;
  },
  returns: v.id("posts"),
});

export const update = mutation({
  args: {
    authorName: v.optional(v.string()),
    categoryId: v.optional(v.id("postCategories")),
    content: v.optional(v.string()),
    renderType: v.optional(v.union(
      v.literal("content"),
      v.literal("markdown"),
      v.literal("html")
    )),
    markdownRender: v.optional(v.string()),
    htmlRender: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    id: v.id("posts"),
    metaDescription: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    order: v.optional(v.number()),
    slug: v.optional(v.string()),
    status: v.optional(contentStatus),
    thumbnail: v.optional(v.string()),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await PostsModel.update(ctx, args);
    await ctx.runMutation(api.landingPages.syncProgrammaticFromSourceChange, { source: "post" });
    return null;
  },
  returns: v.null(),
});

export const incrementViews = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    await PostsModel.incrementViews(ctx, args);
    return null;
  },
  returns: v.null(),
});

export const remove = mutation({
  args: { cascade: v.optional(v.boolean()), id: v.id("posts") },
  handler: async (ctx, args) => {
    await PostsModel.remove(ctx, args);
    await ctx.runMutation(api.landingPages.syncProgrammaticFromSourceChange, { source: "post" });
    return null;
  },
  returns: v.null(),
});

export const getDeleteInfo = query({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => PostsModel.getDeleteInfo(ctx, args),
  returns: v.object({
    canDelete: v.boolean(),
    dependencies: v.array(v.object({
      count: v.number(),
      hasMore: v.boolean(),
      label: v.string(),
      preview: v.array(v.object({ id: v.string(), name: v.string() })),
    })),
  }),
});
