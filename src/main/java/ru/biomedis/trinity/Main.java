package ru.biomedis.trinity;

import io.vertx.core.Vertx;
import io.vertx.core.VertxOptions;
import javafx.application.Application;
import javafx.geometry.Rectangle2D;
import javafx.scene.Scene;
import javafx.scene.paint.Color;
import javafx.stage.Screen;
import javafx.stage.Stage;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import ru.biomedis.trinity.Utils.UTF8Control;
import ru.biomedis.trinity.backend.Server;

import java.util.ResourceBundle;

public class Main extends Application {
    private Scene scene;
    private static Vertx vertx;
    private static Server server;
    private static boolean develop = true;
    private static boolean enableEmbeddedBrowser = true;
    private static int port = 3000;//0 для автоматического выбора
    private static final Logger logger = LogManager.getLogger(Main.class.getName());
    private static String startPage = "/public/index.html";

    @Override
    public void start(Stage stage) {

        logger.info("Приложение запускается!");

        stage.setOnCloseRequest(event -> {
            logger.info("Приложение останавливается!");
            vertx.undeploy(server.deploymentID(), e -> vertx.close());

        });

        //загрузим перевод интерфейса на выбранный язык!
        ResourceBundle bundle = ResourceBundle.getBundle("strings.strings", new UTF8Control());

        Rectangle2D screenBound = Screen.getPrimary().getBounds();
        // create the scene
        stage.setTitle(bundle.getString("app.name"));
        scene = new Scene(new Browser("http://127.0.0.1:" + port + startPage),
                screenBound.getMaxX(),
                screenBound.getMaxY(),
                Color.web("#FFFFFF"));
        stage.setScene(scene);
        scene.getStylesheets().add("./BrowserToolbar.css");
        stage.show();


    }

    public static void main(String[] args) {
        logger.info("Запуск сервера");
        vertx = Vertx.vertx(new VertxOptions().setWorkerPoolSize(10));
        server = new Server(port, develop);

        vertx.deployVerticle(server, event -> {

            if (!event.succeeded()) {
               logger.error("Ошибка деплоя сервисов",event.cause());

               System.exit(1);
            }else{
                Main.port = server.getActualPort();
                logger.info("Сервер запущен на порту: " + port);
                if (enableEmbeddedBrowser) new Thread(()->launch(args)).start();
            }
        });


    }




}
