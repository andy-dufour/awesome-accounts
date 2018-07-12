# Prep

Spin up the terraform plan. Paste your public IPs here incase you lose them later:


public_ips_mysql = [
    54.203.119.3,
    52.34.65.4,
    34.217.76.213
]
public_ips_nodeapp = 34.217.32.84
public_ips_supervisor_peer = 34.217.206.53

Have 5 ssh windows open. 3 connected to mysql, 1 to nodejs vms. One in the project directory ready to spin up Docker.

# Talk track with demo

For the next 15 minutes or so, we're going to take the roll of a DevOps engineer. Our goal is to build and deploy relatively complex application we'll be building a system that uses a highly available 3 node mySQL cluster. We'll then add a nodejs front-end running our awesome accounts application.

Lets start with a diagram of the system we're going to build.

Let's take a look at a Habitat plan. If you'll notice, this plan is less than 20 lines long. With whats defined in this plan we'll be able to build our NodeJS application using scaffolding. Scaffolding is a type of Habitat plan that lets you build common application types with very little configuration. Scaffolding exists for popular application types like NodeJS, go, gradle and more.

Inside the plan, you can see we have something called a bind. Using a bind, we can define a contract between two services. In this case we're defining that we need three things from a database service: A username, a password, and a port.

We're also defining our dependencies, as Habitat will package your app and all of its dependencies together into a single artifact. Instead of needing to compile, install, or bind your dependencies at install time, we're taking care of that complexity and shifting it left to build time. This means your application will install reliably, with the right dependencies every time its deployed. Another great advantage to this is that you have a list of every dependency your application uses. If there's a vulnerability, you'll be able to find out. Let's take a look at the transitive dependency list in builder to see what it looks like.

Before we talk more about the plan, lets enter the habitat studio and actually build our application.

`$ hab studio enter`

`$ build`

So we entered this thing called The Habitat Studio. The studio is a clean, self-contained, minimal environment in which you can develop, build, and package software that is free from any upstream operating system distribution. All tools and dependencies included in the Studio are installed through Habitat packages, thus preventing any unwanted dependencies from being used by your package.



As you can see, habitat is resolving our dependency list. Its taking our listed dependencies in our plan.sh as well as the dependencies of the nodejs scaffolding.

While this builds, we'll explore what else makes up our Habitat plan. Each plan can specify lifecycle event handlers, or hooks, to perform certain actions during a service's runtime. Application lifecycle hooks are there to automate your application, and make it intelligent - your application decides what to do when an actor (a database node, application container, etc) leaves the cluster, or when a new one joins, or when a new set of configuration for your application or service is distributed. Some examples of hooks are:

init
run
post-run
smoke_test

Lets look at our init hook.

As you can see, we're using our init hook to create and populate our initial mysql databse if it doesn't exist yet. In our case, the nodejs scaffolding is going to populate other hooks automatically for us, such as the run hook.

We also have a config directory. Inside we have a couple of files. First, is an application config.json. You can see we're loading values from Habitats database bind. This is configuring our application to dynamically use the database we configure it to in Habitat. We also have a sql file which is being used in our init hook to populate our initial database.

Finally we have a default.toml. This is a place to store default configuration settings for your service or application. In this case we've specified a bind port.

Let's check in on our build. Look, its completed successfully and we can see the artifact its created.

While we work on deploying this to VMs, we're going to prep a deployment to containers. This is an amazing feature of Habitat. The exact same package we'll run on VMs can be picked up and deployed to other infrastructure, including containers, in a few simple commands. Let's create that container now:

`$ hab pkg export docker artifact`

Now, lets go deploy to VMs.

<open your 3 mysql ssh windows>

Lets deploy a highly available mysql cluster:

Run on all mysql instances:

`hab svc load core/mysql --group awesome-accounts --topology leader`

As you can see, habitat is downloading and deploying the mysql package, the exact dependencies it was built with, and deploying it to our VMs. As the mysql instances come online, they'll discover each other using Habitats supervisor ring, and form a highly available mysql cluster. As you can see, one of them has become the cluster leader, and the other two have become replicas.

Next, we need to deploy our nodejs application.

<open your nodejs ssh window>

Let's start our application:

`hab svc load andy-dufour/awesome-accounts --bind database:mysql.awesome-accounts --strategy at-once`

As you can see we're loading our awesome-accounts app, at the same time we're creating a bind saying our database exists as the mysql service in the awesome-accounts service group.  By doing this, our habitat plan will resolve the correct binds and connect to that mysql cluster. We're also giving the service an update strategy, so if we push a new version of the package out to the stable branch it will get deployed automatically. let's take a look at the logs. `journalctl -f -n20` You can see there's a log line that states mysql.awesome-accounts satisfies our database bind. If that mysql service did not provide what we stated we needed as a contract in our plan, our application would not start. By creating contracts between services we're able to reliably set expectations and depend on other plans.

Alright, lets go check out our application.

`<open a web browser and visit your nodejs site on port 5000>`

http://34.217.32.84:5000

Here's our application. It may not look like much, but this is a fully functional nodejs app that is connected to a HA mysql cluster <*Show some functionality*>. It fulfills a large portion of what many of your home baked applications will need. In addition to this, we've packaged up a lot of agents and COTS software with other customers. Imagine a world where most of your applications are managed via the same lifecycle regardless of language, runtime or whether you built it or not.

OK, thats enough of this boring VM stuff. Let's go look at some new container hotness.

Lets check in on our docker export. As you can see, we've successfully exported a docker container and it now lives in my local container registry.

Let's use docker-compose to standup a three node mysql cluster, and our nodejs front-end.

`$ cd <project root>/docker`

`$ docker-compose up -d mysql1 mysql2 mysql3`

In the same way we created a mysql cluster on VMs, we're creating a container based mysql cluster. While these containers spin up, are there any questions we can answer?

...

OK, lets launch our application in docker:

`$ docker-compose up nodeapp1`

Again, we see our nodeapp is binding to our newly created mysql cluster. Our application should now be running on my laptop on port 5000.

<visit app in browser>

The next thing we'll need to do is deploy an update.

Let's open our default.toml, and change our banner to be something different.

Alright, now lets build this new copy of our app.

`$ build`

- Walk them through habitat.sh

Let's publish it.

`hab pkg upload <artifact>`

Let's promote it.

`hab pkg promote andy-dufour/awesome-accounts/0.1.0/20180615070135 stable`

Let's see it deploy to our VM infrastructure.

Finally, lets take a look at how we can query the running habitat supervisor for information:

`34.217.32.84:9631/services/awesome-accounts/default`

So, what we've explored today is the deployment of a multi-tiered application using native habitat constructs on both VMs and containers.



Habitat can also export to many different runtimes like Mesos, Kubernetes, Helm, and more.

We're seeing other consumption models as well where your application may run in a PCF instance, or inside of Kubernetes natively, and you call out to an OpenService broker API for your back-end service. We have customers using that to
