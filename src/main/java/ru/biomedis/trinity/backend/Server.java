package ru.biomedis.trinity.backend;

import io.vertx.core.AbstractVerticle;
import io.vertx.core.CompositeFuture;
import io.vertx.core.Future;
import io.vertx.core.http.HttpServer;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.handler.StaticHandler;

import java.util.Arrays;

/**
 * Created by anama on 13.03.17.
 */
public class Server extends AbstractVerticle {

    private int desirePort;
    private final boolean debug;

    private int actualPort;


    public Server(int desirePort, boolean debug) {
        this.desirePort = desirePort;
        this.debug = debug;
    }

    @Override
    public void start(Future<Void> startFuture) throws Exception {



        Router router = Router.router(vertx);

        router.route("/public/*").handler(StaticHandler.create().setCachingEnabled(!debug));

        HttpServer httpServer = vertx.createHttpServer();

        httpServer.requestHandler(router::accept).listen(desirePort, event -> {
            if (event.succeeded()) {
                 actualPort=httpServer.actualPort();
                deployOthers(startFuture);


            } else {
                startFuture.fail(event.cause());

            }

        });

    }

    @Override
    public void stop(Future<Void> stopFuture) throws Exception {


        stopFuture.complete();

    }

    public int getActualPort() {
        return actualPort;
    }

    //записать комбинацию асинхронных вызовов.
    private void deployOthers(Future<Void> future){

        Future future1 =Future.future();
        DataModel dm=new DataModel();
        vertx.deployVerticle(dm,future1.completer());

        CompositeFuture.all(Arrays.asList(future1)).setHandler(res->{

            if(res.succeeded())future.complete();
            else future.fail(res.cause());

        });
    }



}

