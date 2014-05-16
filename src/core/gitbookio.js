define([
    "hr/utils",
    "core/settings",
    "utils/dialogs"
], function(_, settings, dialogs) {
    var GitBook = node.require("gitbook-api");
    var client = new GitBook();

    var setConfig = function() {
        client.config = {
            host: settings.get("host") || "https://www.gitbook.io",
            auth: {
                username: settings.get("username"),
                password: settings.get("token")
            }
        };
        client.updateConfig();
    };

    settings.on("set", setConfig);
    setConfig();

    /* Dialog to connect an account */
    var connectAccount = function() {
        return dialogs.fields("Connect your GitBook.io account", {
            username: {
                label: "Username or Email",
                type: "text"
            },
            password: {
                label: "Password",
                type: "password"
            }
        }, {})
        .then(function(auth) {
            return gitbookIo.login(auth.username, auth.password);
        })
        .then(function() {
            settings.set("username", gitbookIo.config.auth.username);
            settings.set("token", gitbookIo.config.auth.password);
            settings.setStateToStorage();
        })
        .then(function() {
            dialogs.alert("Account connected", "You're account is now connected to this computer.");
        }, dialogs.error)
    };

    /* Publish a book */
    var publishBook = function(toPublish) {
        var books, book;

        return client.books()
        .then(function(_books) {
            books = _books;

            return dialogs.select(
                "Book to publish on",
                "Select the book to publish on",
                _.chain(books)
                .map(function(book) {
                    return [
                        book.id,
                        book.id
                    ]
                })
                .object()
                .value()
            );
        })
        .then(function(bookId) {
            book =_.find(books, function(_book) {
                return _book.id == bookId;
            });

            return dialogs.prompt("Version", "Tag this book version", "0.0.1");
        })
        .then(function(version) {
            if (!version) throw "Need a version";

            return book.publishFolder(version, toPublish.root());
        })
        .fail(dialogs.error);
    };

    return {
        api: client,
        connectAccount: connectAccount,
        publishBook: publishBook
    };
});