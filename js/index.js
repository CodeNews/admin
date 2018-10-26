var app = angular.module('app', [])
var converter = new showdown.Converter()

app.controller('mainController', function ($compile, $timeout, $scope) {
  $scope.tokenUser = ''
  $scope.post = {}
  $scope.contributor = {}

  if (localStorage.getItem('contributor')) {
    $timeout(function () {
      $scope.tokenUser = localStorage.getItem('contributor')
      $scope.checkContribuitor()
    })
  }

  $scope.makeHtml = function () {
    document.getElementById('description-post').innerHTML = converter.makeHtml($scope.post.description)
  }

  $scope.getCategoryClass = function () {
    if ($scope.post.category === 'Node.js') return 'green'
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

  $scope.showPost = function (post) {
    $scope.post = angular.copy(post)
    $scope.posts.length = 0
    $scope.showListPosts = false
    $timeout(function () {
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
    $scope.post.category_class = $scope.getCategoryClass()
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
    $scope.post.category_class = $scope.getCategoryClass()
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
