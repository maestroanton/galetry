document.addEventListener('DOMContentLoaded', function () {
    Parse.initialize("uJg1h7ZHbVMfs6mB1HFJGkxQF9HyrSLWEU2Zk6wF",
        "6APyzapHbqjnODf7FseC1Svx5Lcz2WETEsWAuCa4");
    Parse.serverURL = "https://parseapi.back4app.com/";

    const addPostButton = document.getElementById('add-post-btn');
    const removePostButton = document.querySelector('.remove-post');
    const imageUploadInput = document.getElementById('image-upload');
    const postsSection = document.querySelector('.posts');
    const profileNameElement = document.querySelector('.profile-info h2');
    const editNameButton = document.querySelector('.edit-btn');
    const statsPostsElement = document.querySelector('.stats span:nth-child(1)');
    const carouselOverlay = document.getElementById('carousel-overlay');
    const carouselModal = document.getElementById('carousel-modal');
    const carouselImage = document.getElementById('carousel-image');
    const carouselCloseBtn = document.getElementById('carousel-close-btn');
    const carouselPrevBtn = document.getElementById('carousel-prev-btn');
    const carouselNextBtn = document.getElementById('carousel-next-btn');
    const commentInput = document.getElementById('comment-input');
    const submitCommentBtn = document.getElementById('submit-comment-btn');
    const commentsList = document.querySelector('.comments-list');

    let modoDeDelecaoAtivo = false;
    let isEditingName = false;
    let postsData = [];
    let currentPostIndex = 0;
    let currentPostObjectId = null;

    async function fetchPosts() {
        postsSection.innerHTML = '';
        postsData = [];
        const query = new Parse.Query("Post");
        query.descending("createdAt");
        try {
            const results = await query.find();
            statsPostsElement.innerHTML = `${results.length} <span class="cinza">publicações</span>`;
            for (let i = 0; i < results.length; i++) {
                const object = results[i];
                const imageFile = object.get('image');
                if (imageFile && typeof imageFile.url === 'function') {
                    const imageUrl = imageFile.url();
                    const postDiv = document.createElement('div');
                    postDiv.className = 'post';
                    postDiv.style.backgroundImage = `url('${imageUrl}')`;
                    postDiv.dataset.objectId = object.id;
                    postDiv.addEventListener('click', async function () {
                        if (modoDeDelecaoAtivo) {
                            const postIdToDelete = this.dataset.objectId;
                            await deletePost(postIdToDelete);
                            modoDeDelecaoAtivo = false;
                            alert("Post removido com sucesso!");
                            fetchPosts();
                        } else {
                            openCarousel(i);
                        }
                    });
                    postsSection.appendChild(postDiv);
                    postsData.push({
                        objectId: object.id,
                        imageUrl: imageUrl
                    });
                } else {
                    console.warn("Post encontrado sem um arquivo de imagem válido:", object);
                }
            }
        } catch (error) {
            console.error("Error fetching posts: ", error);
        }
    }

    async function fetchComments(postId) {
        console.log("Current Post ID in fetchComments:", postId);
        const query = new Parse.Query("Comment");
        query.equalTo("postId", postId);
        query.descending("createdAt");
        try {
            const results = await query.find();
            commentsList.innerHTML = ''; // Clear previous comments
            results.forEach(comment => {
                const commentDiv = document.createElement('div');
                commentDiv.className = 'comment';
                commentDiv.dataset.commentId = comment.id; // Store comment ID
                commentDiv.innerHTML = `
                    <p class="comment-text"><strong>${comment.get('username')}:</strong> ${comment.get('text')}
                        <i class="fa-solid fa-trash-can delete-comment-icon" style="cursor: pointer; margin-left: 10px;"></i>
                    </p>`;
                commentsList.appendChild(commentDiv);
            });
        } catch (error) {
            console.error("Error fetching comments: ", error);
            commentsList.innerHTML = '<p>Erro ao carregar os comentários.</p>';
        }
    }

    async function openCarousel(index) {
        currentPostIndex = index;
        loadCurrentImage();
        carouselOverlay.style.display = 'flex';
        currentPostObjectId = postsData[currentPostIndex].objectId;
        console.log("Current Post ID when opening:", currentPostObjectId);
        await fetchComments(currentPostObjectId);
    }

    function closeCarousel() {
        carouselOverlay.style.display = 'none';
    }

    function loadCurrentImage() {
        if (postsData.length > 0 && currentPostIndex >= 0 && currentPostIndex < postsData.length) {
            carouselImage.src = postsData[currentPostIndex].imageUrl;
        }
    }

    function showPreviousPost() {
        if (currentPostIndex > 0) {
            currentPostIndex--;
            loadCurrentImage();
            currentPostObjectId = postsData[currentPostIndex].objectId;
            console.log("Current Post ID in showPreviousPost:", currentPostObjectId);
            fetchComments(currentPostObjectId);
        }
    }

    function showNextPost() {
        if (currentPostIndex < postsData.length - 1) {
            currentPostIndex++;
            loadCurrentImage();
            currentPostObjectId = postsData[currentPostIndex].objectId;
            console.log("Current Post ID in showNextPost:", currentPostObjectId);
            fetchComments(currentPostObjectId);
        }
    }

    async function createPost(file) {
        if (!file) {
            alert("Por favor, selecione uma imagem.");
            return;
        }

        const parseFile = new Parse.File("post_image.jpg", file);
        try {
            await parseFile.save();

            const Post = Parse.Object.extend("Post");
            const post = new Post();
            post.set("image", parseFile);

            await post.save();
            console.log('Post saved successfully with objectId: ' + post.id);
            fetchPosts();
            alert("Post adicionado com sucesso!");

        } catch (error) {
            console.error("Error saving post: ", error);
            alert("Erro ao adicionar post. Por favor, tente novamente.");
        }
    }

    async function deletePost(postId) {
        const Post = new Parse.Object("Post");
        Post.id = postId;

        try {
            await Post.destroy();
            console.log('Post deleted successfully with objectId: ' + postId);
        } catch (error) {
            console.error("Error deleting post: ", error);
            alert("Erro ao remover post. Por favor, tente novamente.");
        }
    }

    async function fetchUserName() {
        const query = new Parse.Query("usuario");
        try {
            const user = await query.first();
            if (user) {
                return user.get('username');
            } else {
                return "Antonio Gomes";
            }
        } catch (error) {
            console.error("Error fetching user from 'usuario' class", error);
            return "Antonio Gomes";
        }
    }

    async function updateUserName(newName) {
        const query = new Parse.Query("usuario");
        try {
            const user = await query.first();
            if (user) {
                user.set('username', newName);
                try {
                    await user.save();
                    alert("Nome de usuário atualizado com sucesso!");
                    profileNameElement.textContent = newName;
                } catch (error) {
                    console.error("Error saving user in 'usuario' class", error);
                    alert("Erro ao atualizar nome de usuário.");
                }
            } else {
                alert("Erro ao atualizar nome de usuário.");
            }
        } catch (error) {
            console.error("Error querying user in 'usuario' class", error);
            alert("Erro ao atualizar nome de usuário.");
        }
    }

    if (addPostButton) {
        addPostButton.addEventListener('click', () => {
            imageUploadInput.click();
        });
    } else {
        console.error("addPostButton is null. Check if element with id 'add-post-btn' exists in HTML.");
    }

    removePostButton.addEventListener('click', () => {
        modoDeDelecaoAtivo = true;
        alert("Selecione o post que deseja deletar.");
    });

    editNameButton.addEventListener('click', () => {
        if (!isEditingName) {
            isEditingName = true;
            const currentName = profileNameElement.textContent;
            profileNameElement.innerHTML = '';
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.value = currentName;
            profileNameElement.appendChild(nameInput);

            const saveButton = document.createElement('button');
            saveButton.textContent = 'Salvar';
            saveButton.onclick = async () => {
                const newName = nameInput.value;
                await updateUserName(newName);
                isEditingName = false;
                profileNameElement.innerHTML = newName;
            };
            profileNameElement.appendChild(saveButton);

            const cancelButton = document.createElement('button');
            cancelButton.textContent = 'Cancelar';
            cancelButton.onclick = () => {
                isEditingName = false;
                fetchInitialUserName();
            };
            profileNameElement.appendChild(cancelButton);
        }
    });

    imageUploadInput.addEventListener('change', async (event) => {
        const file = imageUploadInput.files[0];
        createPost(file);
    });

    async function saveComment() {
        const commentText = commentInput.value.trim();
        if (commentText && currentPostObjectId) {
            console.log("Current Post ID when saving:", currentPostObjectId);
            const username = await fetchUserName();
            const Comment = Parse.Object.extend("Comment");
            const comment = new Comment();
            comment.set("postId", currentPostObjectId);
            comment.set("username", username);
            comment.set("text", commentText);

            try {
                await comment.save();
                commentInput.value = ''; // Clear the input field
                await fetchComments(currentPostObjectId); // Refresh comments
            } catch (error) {
                console.error("Error saving comment: ", error);
                alert("Erro ao enviar o comentário. Por favor, tente novamente.");
            }
        } else if (!commentText) {
            alert("Por favor, digite um comentário.");
        } else {
            alert("Erro: Nenhum post está aberto para comentar.");
        }
    }

    async function deleteComment(commentId) {
        const CommentToDelete = new Parse.Object("Comment");
        CommentToDelete.id = commentId;
        try {
            await CommentToDelete.destroy();
            console.log('Comment deleted successfully with objectId: ' + commentId);
            await fetchComments(currentPostObjectId); // Refresh comments
        } catch (error) {
            console.error("Error deleting comment: ", error);
            alert("Erro ao deletar o comentário.");
        }
    }

    commentsList.addEventListener('click', function (event) {
        if (event.target.classList.contains('delete-comment-icon')) {
            const commentDiv = event.target.closest('.comment');
            if (commentDiv) {
                const commentId = commentDiv.dataset.commentId;
                if (commentId) {
                    deleteComment(commentId);
                }
            }
        }
    });

    if (submitCommentBtn) {
        submitCommentBtn.addEventListener('click', saveComment);
    } else {
        console.error("submitCommentBtn is null. Check if element with id 'submit-comment-btn' exists in HTML.");
    }


    function closeCarouselOnOverlayClick(event) {
        if (event.target === carouselOverlay) {
            closeCarousel();
        }
    }

    carouselCloseBtn.addEventListener('click', closeCarousel);
    carouselOverlay.addEventListener('click', closeCarouselOnOverlayClick);
    carouselPrevBtn.addEventListener('click', showPreviousPost);
    carouselNextBtn.addEventListener('click', showNextPost);

    async function fetchInitialUserName() {
        const userName = await fetchUserName();
        profileNameElement.textContent = userName;
    }

    fetchPosts();
    fetchInitialUserName();
});