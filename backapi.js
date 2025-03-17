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

  let modoDeDelecaoAtivo = false;
  let isEditingName = false;

  async function fetchPosts() {
    postsSection.innerHTML = '';
    const query = new Parse.Query("Post");
    query.descending("createdAt");
    try {
      const results = await query.find();
      statsPostsElement.innerHTML = `${results.length} <span class="cinza">publicações</span>`;
      for (let i = 0; i < results.length; i++) {
        const object = results[i];
        const imageFile = object.get('image');
        if (imageFile) {
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
            }
          });
          postsSection.appendChild(postDiv);
        }
      }
    } catch (error) {
      console.error("Error fetching posts: ", error);
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
    console.log("fetchUserName: Attempting to fetch username from 'usuario' class");
    const query = new Parse.Query("usuario"); // Changed to "usuario" class
    try {
      const user = await query.first();
      if (user) {
        console.log("fetchUserName: User found in 'usuario' class", user);
        return user.get('username'); // Assuming 'username' is the column name
      } else {
        console.log("fetchUserName: No user found in 'usuario' class, returning default name");
        return "Antonio Gomes";
      }
    } catch (error) {
      console.error("fetchUserName: Error fetching user from 'usuario' class", error);
      return "Antonio Gomes";
    }

  }

  async function updateUserName(newName) {
    console.log("updateUserName: Attempting to update username in 'usuario' class to:", newName);
    const query = new Parse.Query("usuario"); // Changed to "usuario" class
    try {
      console.log("updateUserName: Querying for user in 'usuario' class");
      const user = await query.first();
      if (user) {
        console.log("updateUserName: User found in 'usuario' class", user);
        console.log("updateUserName: Setting new username in 'usuario' class");
        user.set('username', newName); // Assuming 'username' is the column name
        console.log("updateUserName: Attempting to save user in 'usuario' class");
        try {
          await user.save();
          console.log("updateUserName: User saved successfully in 'usuario' class");
          alert("Nome de usuário atualizado com sucesso!");
          profileNameElement.textContent = newName;
        } catch (error) {
          console.error("updateUserName: Error saving user in 'usuario' class", error);
          alert("Erro ao atualizar nome de usuário.");
        }
      } else {
        console.log("updateUserName: No user found in 'usuario' class to update");
        alert("Erro ao atualizar nome de usuário.");
      }
    } catch (error) {
      console.error("updateUserName: Error querying user in 'usuario' class", error);
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

  async function fetchInitialUserName() {
    const userName = await fetchUserName();
    profileNameElement.textContent = userName;
  }

  fetchPosts();
  fetchInitialUserName();
});