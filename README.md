DATABASE
1. USER
2. CATEGORY
3. BLOG

1. USER SCHEMA
    username**
    name
    email
    profile
    hashed_password
    salt
    role
    photo
    resetPasswordLink:
    savedPost

2. CATEGORY SCHEMA
    name
    slug**

3. BLOG SCHEMA
    title
    slug**
    body
    excerpt
    mtitle
    mdesc
    photo
    categories
    postedBy

APIs
1. Auth
2. Blog
3. Category
4. User

1. Auth APIs
    1.1 User SignUp  - /signup
    1.2 User SignIn  - /signin
    1.3 USer Logout  - /signout
    1.4 Save Article - /profile/bookmarks ----->>Neeed Change

2. User APIs
    2.1 Profile        - /user/profile         (GET)
    2.2 Update Profile - /user/update          (PUT)
    2.3 Profile Pic    - /user/photo/:username (GET)

3. Blog APIs
    2.1 Create Blog - /blog              (POST)
    2.2 View Blog   - /articles/:slug    (GET)
    2.3 Update Blog - /blog/update/:slug (POST)
    2.4 Remove Blog - /blog/remove/:slug (REMOVE)
    2.5 List Blogs  - /blogs             (POST)
    2.6 Bookmark    - /blog/bookmark     (POST)
    2.7 Get Photo   - /blog/photo/:slug  (GET)
    
    TextEditor
    A. Upload Image by Pasting - /uploadFile/:slug  (POST)
    B. Upload Image from Local - /uploadUrl         (POST)
    C. Paste Link              - /linkUrl           (GET)

4. Category APIs
    3.1 Create Category       - /category         (POST)
    3.2 View Category List    - /categories       (GET)
    3.3 Blog List By Category - /category/:slug   (GET)
    3.4 Delete Category       - /category/:slug   (DELETE)
    3.5 Update Category       - /category/:slug   (PUT)

Controllers
1. Auth
2. Blog
3. Category
4. User

1. Auth
    1.1 User Sign Up            - signup
    1.2 User Sign In            - signin
    1.3 User Sign Out           - signout
    1.4 Check Password          - requireSignin
    1.5 Check if User Exist     - authMiddleware
    1.6 Admin Resource          - adminMiddleware
    1.7 SuperAdmin Resource     - superAdminMiddleware
    1.8 List Bookmarked Blog    - savedBlog

2. Blog
    1.1 Create Blog             - create
    1.2 List Blog               - list
    1.3 Read Single Blog        - read
    1.4 Remove Blog             - remove
    1.5 Update Blog             - update
    1.6 Load Featured Image     - photo
    1.7 List Related Blog       - listRelated       
    1.8 Search                  - listSearch
    1.9 BookMark                - bookmark
    1.10 List By User           - listByUser (Unreleased)

3. Category 
    3.1 Create Category          - create
    3.2 List Category            - list
    3.3 Read Blog By Category    - read
    3.4 Remove Category          - remove
    3.5 Update Category          - update

4. User
    4.1 View Profile          - read
    4.2 Update Profile        - update
    4.3 Get Profile Photo     - photo
    4.4 Public Profile        - publicProfile (Unreleased)
    
