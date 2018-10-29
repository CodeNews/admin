var app = angular.module('app', [])
var converter = new showdown.Converter()

app.controller('mainController', function ($compile, $timeout, $scope) {
  $scope.tokenUser = ''
  $scope.post = {
    language: 'pt-br'
  }
  $scope.contributor = {}
  $scope.tags = []

  if (localStorage.getItem('contributor')) {
    $timeout(function () {
      $scope.tokenUser = localStorage.getItem('contributor')
      $scope.checkContribuitor()
    })
  }

  function getTags () {
    $scope.tags.length = 0
    MobileUI.ajax.get(CONFIG.URL_API + '/posts/tags').end(function (err, res) {
      if (err) return alert('Não foi possível listar tags!')
      $timeout(function () {
        $scope.tags = res.body.data
      })
    })
  }

  $scope.makeHtml = function () {
    document.getElementById('description-post').innerHTML = converter.makeHtml($scope.post.description)
  }

  $scope.loadUrl = function () {
    loading('Carregando dados da URL...')
    MobileUI.ajax.post(CONFIG.URL_API + '/posts/load?token=' + $scope.tokenUser, { url: $scope.post.url_complete }).end(function (err, res) {
      closeLoading()
      if (err || res.body.errorMessage) return alert(res.body.errorMessage || err)
      $timeout(function () {
        var post = res.body.data
        if (post.image && post.image.url) {
          $scope.post.image = post.image.url
        }
        if (post.title) {
          $scope.post.title = post.title
        }
        if (post.description) {
          $scope.post.description = post.description
          $scope.makeHtml()
        }
        if (post.locale && post.locale.indexOf('en') !== -1) {
          $scope.post.language = 'en'
        }
        if (post.locale && post.locale.indexOf('pt') !== -1) {
          $scope.post.language = 'pt-br'
        }
        if (post.author) {
          $scope.post.author = post.author
        }
      })
    })
  }

  $scope.checkTags = function () {
    $scope.post.tags = $scope.tags.filter(function (tag) {
      return tag.checked
    })
  }

  $scope.checkContribuitor = function () {
    if ($scope.tokenUser && $scope.tokenUser.length > 10) {
      loading('Carregando seus dados...')
      MobileUI.ajax.get(CONFIG.URL_API + '/contributors?token=' + $scope.tokenUser).end(function (err, res) {
        closeLoading()
        if (err || res.body.errorMessage) return alert(res.body.errorMessage || err)
        $timeout(function () {
          if (!res.body.data || !res.body.data._id) {
            alert('Token de acesso incorreto!')
          } else {
            $scope.contributor = res.body.data
            localStorage.setItem('contributor', $scope.tokenUser)
            getTags()
          }
        })
      })
    }
  }

  $scope.showPosts = function () {
    if (!$scope.contributor._id) return alert('Você precisa digitar seu token primeiro!')
    loading('Carregando publicações...')
    MobileUI.ajax.get(CONFIG.URL_API + '/posts?token=' + $scope.tokenUser).end(function (err, res) {
      closeLoading()
      if (err || res.body.errorMessage) return alert(res.body.errorMessage || err)
      $timeout(function () {
        $scope.posts = res.body.data
        console.log($scope.posts)
        $scope.showListPosts = true
      })
    })
  }

  $scope.addTag = function () {
    alert({
      title: 'nova tag',
      message: 'Digite o nome da Tag: <div class="list"><div class="item"><input id="tag-name" placeholder="Tag" type="text"></div></div>',
      buttons: [
        {
          label: 'Salvar',
          onclick: function () {
            var nameTag = document.getElementById('tag-name').value
            if (!nameTag) {
              return alert('Digite o nome da Tag!')
            }
            closeAlert()
            loading('Criando tag...')
            MobileUI.ajax.post(CONFIG.URL_API + '/posts/tags?token=' + $scope.tokenUser, { name: nameTag }).end(function (err, res) {
              closeLoading()
              if (err || res.body.errorMessage) return alert(res.body.errorMessage || err)
              $timeout(function () {
                getTags()
              })
            })
          }
        },
        {
          label: 'Cancelar',
          class: 'text-white'
        }
      ]
    })
  }

  $scope.showPost = function (post) {
    $scope.post = angular.copy(post)
    $scope.posts.length = 0
    $scope.showListPosts = false
    $timeout(function () {
      for (var tag of $scope.tags) {
        tag.checked = false
      }
      for (var iChecked in $scope.post.tags) {
        for (var i in $scope.tags) {
          if ($scope.tags[i]._id === $scope.post.tags[iChecked]._id) {
            $scope.tags[i].checked = true
          }
        }
      }
      $scope.makeHtml()
    }, 200)
  }

  $scope.backPost = function () {
    if ($scope.showListPosts) {
      $scope.posts.length = 0
      $scope.showListPosts = false
    }
  }

  $scope.formatDate = function () {
    var datetime = new Date().getTime()
    return moment(Number(datetime)).fromNow()
  }

  $scope.getDateStart = function (d) {
    if (d) {
      return moment(Number(d)).format('MM/YYYY')
    }
  }

  $scope.saveDraft = function () {
    if (!$scope.contributor._id) return alert('Informe seu token de contribuidor!')

    loading('Salvando rascunho...')
    MobileUI.ajax.post(CONFIG.URL_API + '/posts/draft?token=' + $scope.tokenUser, $scope.post).end(function (err, res) {
      closeLoading()
      if (err || res.body.errorMessage) return alert(res.body.errorMessage || err)
      $timeout(function () {
        $scope.post._id = res.body.data._id
        $scope.post.contributor = res.body.data.contributor
        $scope.post.datetime = res.body.data.datetime
        alert('Rascunho salvo com sucesso!', 'Sucesso')
      })
    })
  }

  $scope.savePublish = function () {
    if (!$scope.contributor._id) return alert('Informe seu token de contribuidor!')

    loading('Salvando e publicando...')
    MobileUI.ajax.post(CONFIG.URL_API + '/posts?token=' + $scope.tokenUser, $scope.post).end(function (err, res) {
      closeLoading()
      if (err || res.body.errorMessage) return alert(res.body.errorMessage || err)
      $timeout(function () {
        $scope.post = {}
        document.getElementById('description-post').innerHTML = ''
        alert('Post publicado com sucesso!', 'Sucesso')
      })
    })
  }

  $scope.removePublishDraft = function () {
    alert({
      title: 'Atenção',
      message: 'Deseja realmente excluir essa publicação?',
      class: 'red',
      buttons: [
        {
          label: 'Sim',
          id: 'alert-remove-post',
          class: 'red-900',
          onclick: function () {
            closeAlert()
            loading('Excluindo post...')
            MobileUI.ajax.delete(CONFIG.URL_API + '/posts?token=' + $scope.tokenUser, $scope.post).end(function (err, res) {
              closeLoading()
              if (err || res.body.errorMessage) return alert(res.body.errorMessage || err)
              $timeout(function () {
                $scope.post = {}
                document.getElementById('description-post').innerHTML = ''
                alert('Post excluido com sucesso!', 'Sucesso')
              })
            })
          }
        },
        {
          label: 'Não',
          class: 'text-white'
        }
      ]
    })
  }

  document.addEventListener('openPage', function (e) {
    $timeout(function () {
      $compile(angular.element(document.getElementById(e.detail.page)))($scope)
    })
  })
})
