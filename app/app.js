if (Meteor.isClient) {
    Session.setDefault('accountTemplate', 'RegisterAccount');

    Template.MainPage.helpers({
        accountTemplate: function() {
            if( Meteor.user() ) {
                // user is already logged in
                Session.set('accountTemplate', 'ResendVerificationEmail');
            }
            return Session.get('accountTemplate');
        }
    });

    Template.RegisterAccount.events({
        'click #register': function () {
            var email = $('#email').val();
            var password = $('#password').val();
            console.log("email: " + email + ", password: " + password);

            Accounts.createUser({email: email, password : password}, function(err){
                if (err) {
                    // Inform the user that account creation failed
                    $('#register-error').text("La création de compte a échoué, votre e-mail existe-t'il déjà ?");
                } else {
                    // Success. Account has been created and the user
                    // has logged in successfully.
                    Session.set('accountTemplate', 'ResendVerificationEmail');
                }
            });
        }
    });

    Template.ResendVerificationEmail.helpers({
        userEmail : function() { return Meteor.user().emails[0].address; },
        userEmailVerificationStatus : function() { return Meteor.user().emails[0].verified ? "verified" : "not verified"; }
    });

    Template.ResendVerificationEmail.events({
        'click #resend-verification-email' : function(e, t) {
            var user = Meteor.user();
            Meteor.call('sendVerificationEmail', user._id, user.emails[0].address);
        }
    });
}

if (Meteor.isServer) {
    Meteor.startup(function () {

        // send verification email when a user is created
        Accounts.config({
            sendVerificationEmail : true,
            loginExpirationInDays: null,
        });

        // change the default URL of the validation link (to avoid conflict with iron:router)
        Accounts.urls.verifyEmail = function (token) {
            return Meteor.absoluteUrl('verifyEmail/' + token);
        };

        // define a method to resend a validation email
        Meteor.methods({
            'sendVerificationEmail' : function(userId, primaryEmail){
                Accounts.sendVerificationEmail(userId, primaryEmail);
            },
        });
    });
}



Router.route('Main', {
    path: '/',
    template: 'MainPage',
});

// iron:router route to verification link
Router.route('VerificationLink', {
    path: '/verifyEmail/:token',
    controller: 'AccountController',
    action: 'verifyEmail',
    waitOn: function() {
        this.subscribe('userData');
    },
});

AccountController = RouteController.extend({
    verifyEmail: function () {
        Accounts.verifyEmail(this.params.token, function (err) {
            Router.go('/');
        });
    }
});
